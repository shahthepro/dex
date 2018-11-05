package app

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"hameid.net/cdex/dex/internal/store"
)

// App layer struct
type App struct {
	router *mux.Router
	store  *store.DataStore
	server *http.Server
	port   string
}

// Start starts app server
func (app *App) Start() {
	app.store.Initialize()

	app.InitializeRoutes()

	app.server = &http.Server{
		Addr:    app.port,
		Handler: app.router}

	fmt.Printf("Running app server on address %s\n", app.server.Addr)

	err := app.server.ListenAndServe()

	if err != nil {
		log.Fatal(err)
	}
}

// Shutdown terminates process and cleans up
func (app *App) Shutdown() {
	app.server.Shutdown(nil)
	app.store.Close()
}

// NewApp creates new instance of App struct
func NewApp(port uint, connectionString string) *App {
	return &App{
		router: mux.NewRouter(),
		store:  store.NewDataStore(connectionString),
		port:   fmt.Sprintf(":%d", port),
	}
}
