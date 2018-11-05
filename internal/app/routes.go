package app

import (
	"database/sql"
	"errors"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	"hameid.net/cdex/dex/internal/models"

	"github.com/ethereum/go-ethereum/common"
	"github.com/gorilla/mux"
	"hameid.net/cdex/dex/internal/helpers"
	"hameid.net/cdex/dex/internal/wrappers"
)

// InitializeRoutes initializes all modules
func (app *App) InitializeRoutes() {
	app.router.StrictSlash(true)
	app.router.HandleFunc("/wallets/{address:0x[0-9A-Za-z]{40}}", app.getWalletBalancesHandler).Methods("GET")
	app.router.HandleFunc("/wallets/{address:0x[0-9A-Za-z]{40}}/{token:0x[0-9A-Za-z]{40}}", app.getWalletBalanceByTokenHandler).Methods("GET")
	app.router.HandleFunc("/orders", app.getOrdersHandler).Methods("GET")
	app.router.HandleFunc("/orders/{hash:0x[0-9A-Za-z]{64}}", app.getOrderByHashHandler).Methods("GET")
	app.router.NotFoundHandler = notFoundHandler()
}

func notFoundHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		helpers.RespondWithError(w, http.StatusBadRequest, "Invalid API endpoint")
	})
}

func (app *App) getWalletBalancesHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	unwrappedAddress := common.HexToAddress(strings.TrimPrefix(vars["address"], "0x"))
	wallets, err := models.GetTokenBalancesForWallet(app.store, wrappers.WrapAddress(&unwrappedAddress))

	if err != nil {
		helpers.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	helpers.RespondWithJSON(w, http.StatusOK, wallets)
}

func (app *App) getWalletBalanceByTokenHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	unwrappedAddress := common.HexToAddress(strings.TrimPrefix(vars["address"], "0x"))
	unwrappedToken := common.HexToAddress(strings.TrimPrefix(vars["token"], "0x"))

	wallet := models.NewWallet(
		wrappers.WrapAddress(&unwrappedAddress),
		wrappers.WrapAddress(&unwrappedToken),
	)

	err := wallet.GetBalance(app.store)

	switch err {
	case nil:
		helpers.RespondWithJSON(w, http.StatusOK, wallet)
	case sql.ErrNoRows:
		wallet.Balance = wrappers.WrapBigInt(big.NewInt(0))
		wallet.EscrowBalance = wrappers.WrapBigInt(big.NewInt(0))
		helpers.RespondWithJSON(w, http.StatusOK, wallet)
	default:
		helpers.RespondWithError(w, http.StatusInternalServerError, "internal error")
	}
}

func (app *App) getOrdersHandler(w http.ResponseWriter, r *http.Request) {
	start, count, err := getOffsetAndCountFromRequest(r)

	if err != nil {
		helpers.RespondWithError(w, http.StatusBadRequest, err.Error())
	}

	var timestamp uint64
	if len(r.FormValue("older_than")) > 0 {
		var err error
		var t int
		t, err = strconv.Atoi(r.FormValue("older_than"))
		if err != nil {
			helpers.RespondWithError(w, http.StatusBadRequest, errInvalidOlderThanParam.Error())
			return
		}
		timestamp = uint64(t)
	} else {
		timestamp = uint64(time.Now().Unix())
	}

	orders, err := models.GetOrders(app.store, start, count, timestamp)

	switch err {
	case nil:
		helpers.RespondWithJSON(w, http.StatusOK, orders)
	default:
		helpers.RespondWithJSON(w, http.StatusInternalServerError, "internal error")
	}
}

func (app *App) getOrderByHashHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	unwrappedHash := common.HexToHash(strings.TrimPrefix(vars["hash"], "0x"))
	hash := wrappers.WrapHash(&unwrappedHash)

	order := models.NewOrder()
	order.Hash = hash

	err := order.Get(app.store)

	switch err {
	case nil:
		helpers.RespondWithJSON(w, http.StatusOK, order)
	case sql.ErrNoRows:
		helpers.RespondWithError(w, http.StatusNotFound, "Order not found")
	default:
		helpers.RespondWithError(w, http.StatusInternalServerError, "internal error")
	}
}

var errInvalidCountParam = errors.New("Invalid value for `count` parameter")
var errInvalidStartParam = errors.New("Invalid value for `start` parameter")
var errInvalidOlderThanParam = errors.New("Invalid value for `older_than` parameter")

func getOffsetAndCountFromRequest(r *http.Request) (int, int, error) {
	count := 10
	start := 0
	var err error

	if len(r.FormValue("count")) > 0 {
		count, err = strconv.Atoi(r.FormValue("count"))
		if err != nil {
			return 0, 0, errInvalidCountParam
		}
		if count > 30 || count < 1 {
			count = 10
		}
	}

	if len(r.FormValue("start")) > 0 {
		start, err = strconv.Atoi(r.FormValue("start"))
		if err != nil {
			return 0, 0, errInvalidStartParam
		}
		if start < 0 {
			start = 0
		}
	}

	return start, count, nil
}
