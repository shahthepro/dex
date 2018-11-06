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
	app.router.HandleFunc("/trades", app.getTradesHandler).Methods("GET")
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
	var params map[string]interface{}
	params = make(map[string]interface{})

	err := getOrderParamsFromRequest(r, &params)

	if err != nil {
		helpers.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	orders, err := models.GetOrders(app.store, params)

	switch err {
	case nil:
		helpers.RespondWithJSON(w, http.StatusOK, orders)
	default:
		helpers.RespondWithJSON(w, http.StatusInternalServerError, "internal error")
	}
}

func (app *App) getTradesHandler(w http.ResponseWriter, r *http.Request) {
	var params map[string]interface{}
	params = make(map[string]interface{})

	err := getTradeParamsFromRequest(r, &params)

	if err != nil {
		helpers.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	trades, err := models.GetTrades(app.store, params)

	switch err {
	case nil:
		helpers.RespondWithJSON(w, http.StatusOK, trades)
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
var errInvalidBeforeParam = errors.New("Invalid value for `before` parameter")
var errInvalidSideParam = errors.New("Invalid value for `side` parameter")
var errInvalidStatusParam = errors.New("Invalid value for `status` parameter")
var errInvalidTokenParam = errors.New("Invalid value for `token` parameter")
var errInvalidBaseParam = errors.New("Invalid value for `base` parameter")

func getOffsetAndCountFromRequest(r *http.Request) (int, int, error) {
	count := 50
	start := 0
	var err error

	if len(r.FormValue("count")) > 0 {
		count, err = strconv.Atoi(r.FormValue("count"))
		if err != nil {
			return 0, 0, errInvalidCountParam
		}
		if count > 50 || count < 1 {
			count = 50
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

func getOrderParamsFromRequest(r *http.Request, params *map[string]interface{}) error {
	var err error

	(*params)["start"], (*params)["count"], err = getOffsetAndCountFromRequest(r)

	if err != nil {
		return err
	}

	if val := r.FormValue("before"); len(val) > 0 {
		var t int
		t, err = strconv.Atoi(val)
		if err != nil {
			return errInvalidBeforeParam
		}
		(*params)["before"] = uint64(t)
	} else {
		(*params)["before"] = uint64(time.Now().Unix())
	}

	if val := r.FormValue("side"); len(val) > 0 {
		(*params)["side"], err = strconv.Atoi(val)
		if err != nil {
			return errInvalidSideParam
		}
	}

	if val := r.FormValue("status"); len(val) > 0 {
		(*params)["status"], err = strconv.Atoi(val)
		if err != nil {
			return errInvalidStatusParam
		}
	}

	if val := r.FormValue("token"); len(val) > 0 {
		if !common.IsHexAddress(val) {
			return errInvalidTokenParam
		}
		(*params)["token"] = val
	}

	if val := r.FormValue("base"); len(val) > 0 {
		if !common.IsHexAddress(val) {
			return errInvalidBaseParam
		}
		(*params)["base"] = val
	}

	return nil
}

func getTradeParamsFromRequest(r *http.Request, params *map[string]interface{}) error {
	if val := r.FormValue("token"); len(val) > 0 {
		if !common.IsHexAddress(val) {
			return errInvalidTokenParam
		}
		(*params)["token"] = val
	}

	if val := r.FormValue("base"); len(val) > 0 {
		if !common.IsHexAddress(val) {
			return errInvalidBaseParam
		}
		(*params)["base"] = val
	}

	return nil
}
