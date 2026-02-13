package main

import (
	"database/sql"
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
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

	// Trim DB URL (fix newline bug)
	dbURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))

	database, err := sql.Open("postgres", dbURL)
	if err != nil {
		panic(err)
	}
	db = database

	createTables()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Authorization"},
	}))

	// AUTH
	r.POST("/register", register)
	r.POST("/login", login)
	r.POST("/profile", saveProfile)

	// TOURNAMENT
	r.GET("/my-tournaments", myTournaments)

	r.POST("/tournament", createTournament)
	r.GET("/tournament/:code", getTournament)
	r.GET("/search", searchTournaments)

	// TEAM
	r.POST("/team", registerTeam)
	r.PUT("/approve/:id", approveTeam)

	// FIXTURES
	r.POST("/fixtures/:tid", generateFixtures)

	r.Run()
}

//////////////////////////////////////////////////////

func createTables() {

	db.Exec(`CREATE TABLE IF NOT EXISTS users(
		id SERIAL PRIMARY KEY,
		email TEXT UNIQUE,
		password TEXT)`)

	db.Exec(`CREATE TABLE IF NOT EXISTS tournaments(
		id SERIAL PRIMARY KEY,
		name TEXT,
		code TEXT,
		location TEXT,
		organizer_email TEXT)`)

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

func myTournaments(c *gin.Context) {
	email := c.GetHeader("Authorization")

	rows, _ := db.Query(
		"SELECT id,name,location,date,code FROM tournaments WHERE organizer_email=$1",
		email)

	var list []gin.H

	for rows.Next() {
		var id int
		var name, loc, date, code string

		rows.Scan(&id, &name, &loc, &date, &code)

		list = append(list, gin.H{
			"id":       id,
			"name":     name,
			"location": loc,
			"date":     date,
			"code":     code,
		})
	}

	c.JSON(200, list)
}

//////////////////////////////////////////////////////

// AUTH

func register(c *gin.Context) {
	var u struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	c.BindJSON(&u)

	var exists int
	db.QueryRow(
		"SELECT COUNT(*) FROM users WHERE email=$1",
		u.Email).Scan(&exists)

	if exists > 0 {
		c.JSON(400, gin.H{"error": "User already exists"})
		return
	}

	hash, _ := bcrypt.GenerateFromPassword(
		[]byte(u.Password), 14)

	db.Exec(
		"INSERT INTO users(email,password) VALUES($1,$2)",
		u.Email, string(hash))

	c.JSON(200, gin.H{"msg": "registered"})
}

func login(c *gin.Context) {
	var u struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	c.BindJSON(&u)

	var hash string

	err := db.QueryRow(
		"SELECT password FROM users WHERE email=$1",
		u.Email).Scan(&hash)

	if err != nil {
		c.JSON(401, gin.H{"error": "User not found"})
		return
	}

	if bcrypt.CompareHashAndPassword(
		[]byte(hash), []byte(u.Password)) != nil {
		c.JSON(401, gin.H{"error": "Wrong password"})
		return
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		jwt.MapClaims{
			"email": u.Email,
			"exp":   time.Now().Add(24 * time.Hour).Unix(),
		})

	t, _ := token.SignedString(jwtKey)

	c.JSON(200, gin.H{"token": t})
}

func saveProfile(c *gin.Context) {

	tokenStr := strings.TrimPrefix(
		c.GetHeader("Authorization"), "Bearer ")

	token, _ := jwt.Parse(tokenStr,
		func(t *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

	email := token.Claims.(jwt.MapClaims)["email"].(string)

	var p struct {
		Name    string `json:"name"`
		Age     int    `json:"age"`
		Aadhaar string `json:"aadhaar"`
		Address string `json:"address"`
		Contact string `json:"contact"`
	}

	c.BindJSON(&p)

	db.Exec(`
	UPDATE users SET
	full_name=$1,age=$2,
	aadhaar_last4=$3,
	address=$4,contact=$5
	WHERE email=$6`,
		p.Name, p.Age, p.Aadhaar,
		p.Address, p.Contact, email)

	c.JSON(200, gin.H{"msg": "profile saved"})
}

//////////////////////////////////////////////////////

// TOURNAMENT

func createTournament(c *gin.Context) {

	tokenStr := strings.TrimPrefix(
		c.GetHeader("Authorization"), "Bearer ")

	token, _ := jwt.Parse(tokenStr,
		func(t *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

	email := token.Claims.(jwt.MapClaims)["email"].(string)

	var t struct {
		Name        string `json:"name"`
		Location    string `json:"location"`
		Date        string `json:"date"`
		EntryFee    int    `json:"entryFee"`
		MaxTeams    int    `json:"maxTeams"`
		Description string `json:"description"`
		Contact     string `json:"contact"`
	}

	c.BindJSON(&t)

	code := fmt.Sprintf("T%d", rand.Intn(99999))

	db.Exec(`
	INSERT INTO tournaments
	(name,location,date,
	entry_fee,max_teams,
	description,contact,
	code,organizer_email)
	VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		t.Name, t.Location, t.Date,
		t.EntryFee, t.MaxTeams,
		t.Description, t.Contact,
		code, email)

	c.JSON(200, gin.H{"code": code})
}

func getTournament(c *gin.Context) {
	code := c.Param("code")

	row := db.QueryRow(
		"SELECT name,location FROM tournaments WHERE code=$1",
		code,
	)

	var name, loc string
	row.Scan(&name, &loc)

	c.JSON(200, gin.H{
		"name":     name,
		"location": loc,
	})
}

func searchTournaments(c *gin.Context) {
	query := c.Query("q")

	rows, _ := db.Query(`
		SELECT id,name,location,code 
		FROM tournaments
		WHERE name ILIKE '%'||$1||'%'
		OR location ILIKE '%'||$1||'%'
		OR code ILIKE '%'||$1||'%'
	`, query)

	var results []gin.H

	for rows.Next() {
		var id int
		var name, loc, code string

		rows.Scan(&id, &name, &loc, &code)

		results = append(results, gin.H{
			"id":       id,
			"name":     name,
			"location": loc,
			"code":     code,
		})
	}

	c.JSON(200, results)
}

//////////////////////////////////////////////////////

// TEAM

func registerTeam(c *gin.Context) {
	var t struct {
		TournamentID int    `json:"tournamentID"`
		TeamName     string `json:"teamName"`
		Captain      string `json:"captain"`
		PaymentProof string `json:"paymentProof"`
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

//////////////////////////////////////////////////////

// FIXTURES

func generateFixtures(c *gin.Context) {
	tid := c.Param("tid")

	rows, _ := db.Query(
		"SELECT team_name FROM teams WHERE tournament_id=$1 AND approved=TRUE",
		tid,
	)

	var teams []string

	for rows.Next() {
		var name string
		rows.Scan(&name)
		teams = append(teams, name)
	}

	rand.Shuffle(len(teams), func(i, j int) {
		teams[i], teams[j] = teams[j], teams[i]
	})

	for i := 0; i < len(teams)-1; i += 2 {
		db.Exec(`INSERT INTO matches(tournament_id,team1,team2)
		VALUES($1,$2,$3)`,
			tid, teams[i], teams[i+1])
	}

	c.JSON(200, gin.H{"msg": "fixtures created"})
}
