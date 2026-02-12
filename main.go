package main

import (
	"database/sql"
	"fmt"
	"math/rand"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var db *sql.DB
var jwtKey []byte

func main() {
	godotenv.Load()

	jwtKey = []byte(os.Getenv("JWT_SECRET"))

	database, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
	if err != nil {
		panic(err)
	}
	db = database

	createTables()

	r := gin.Default()

	r.POST("/register", register)
	r.POST("/login", login)

	r.POST("/tournament", createTournament)
	r.GET("/tournament/:code", getTournament)

	r.POST("/team", registerTeam)
	r.PUT("/approve/:id", approveTeam)

	r.POST("/fixtures/:tid", generateFixtures)

	r.Run()
}

func createTables() {
	db.Exec(`CREATE TABLE IF NOT EXISTS users(
		id SERIAL PRIMARY KEY,
		email TEXT,
		password TEXT)`)

	db.Exec(`CREATE TABLE IF NOT EXISTS tournaments(
		id SERIAL PRIMARY KEY,
		name TEXT,
		code TEXT,
		location TEXT)`)

	db.Exec(`CREATE TABLE IF NOT EXISTS teams(
		id SERIAL PRIMARY KEY,
		tournament_id INT,
		team_name TEXT,
		captain TEXT,
		payment_proof TEXT,
		approved BOOLEAN DEFAULT FALSE)`)

	db.Exec(`CREATE TABLE IF NOT EXISTS matches(
		id SERIAL PRIMARY KEY,
		tournament_id INT,
		team1 TEXT,
		team2 TEXT)`)
}

func register(c *gin.Context) {
	var u struct{ Email, Password string }
	c.BindJSON(&u)

	hash, _ := bcrypt.GenerateFromPassword([]byte(u.Password), 14)
	db.Exec("INSERT INTO users(email,password) VALUES($1,$2)", u.Email, string(hash))

	c.JSON(200, gin.H{"msg": "registered"})
}

func login(c *gin.Context) {
	var u struct{ Email, Password string }
	c.BindJSON(&u)

	var hash string
	db.QueryRow("SELECT password FROM users WHERE email=$1", u.Email).Scan(&hash)

	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(u.Password)) != nil {
		c.JSON(401, gin.H{"error": "invalid"})
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email": u.Email,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	})

	t, _ := token.SignedString(jwtKey)
	c.JSON(200, gin.H{"token": t})
}

func createTournament(c *gin.Context) {
	var t struct{ Name, Location string }
	c.BindJSON(&t)

	code := fmt.Sprintf("T%d", rand.Intn(99999))

	db.Exec("INSERT INTO tournaments(name,code,location) VALUES($1,$2,$3)",
		t.Name, code, t.Location)

	c.JSON(200, gin.H{"code": code})
}

func getTournament(c *gin.Context) {
	code := c.Param("code")

	row := db.QueryRow("SELECT name,location FROM tournaments WHERE code=$1", code)

	var name, loc string
	row.Scan(&name, &loc)

	c.JSON(200, gin.H{
		"name":     name,
		"location": loc,
	})
}

func registerTeam(c *gin.Context) {
	var t struct {
		TournamentID int
		TeamName     string
		Captain      string
		PaymentProof string
	}
	c.BindJSON(&t)

	db.Exec(`INSERT INTO teams(tournament_id,team_name,captain,payment_proof)
	VALUES($1,$2,$3,$4)`,
		t.TournamentID, t.TeamName, t.Captain, t.PaymentProof)

	c.JSON(200, gin.H{"msg": "pending approval"})
}

func approveTeam(c *gin.Context) {
	id := c.Param("id")
	db.Exec("UPDATE teams SET approved=TRUE WHERE id=$1", id)
	c.JSON(200, gin.H{"msg": "approved"})
}

func generateFixtures(c *gin.Context) {
	tid := c.Param("tid")

	rows, _ := db.Query("SELECT team_name FROM teams WHERE tournament_id=$1 AND approved=TRUE", tid)

	var teams []string
	for rows.Next() {
		var name string
		rows.Scan(&name)
		teams = append(teams, name)
	}

	rand.Shuffle(len(teams), func(i, j int) { teams[i], teams[j] = teams[j], teams[i] })

	for i := 0; i < len(teams)-1; i += 2 {
		db.Exec(`INSERT INTO matches(tournament_id,team1,team2)
		VALUES($1,$2,$3)`, tid, teams[i], teams[i+1])
	}

	c.JSON(200, gin.H{"msg": "fixtures created"})
}
