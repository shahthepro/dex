package app

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/gorilla/mux"
	"hameid.net/cdex/dex/internal/helpers"
	"hameid.net/cdex/dex/internal/wrappers"
)

// InitializeRoutes initializes all modules
func (app *App) InitializeRoutes() {
	app.router.HandleFunc("/orders", app.getOrdersHandler).Methods("GET")
	app.router.HandleFunc("/orders/{hash:0x[0-9A-Za-z]{64}}", app.getOrderByHashHandler).Methods("GET")
	app.router.NotFoundHandler = notFoundHandler()
}

func notFoundHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		helpers.RespondWithError(w, http.StatusNotFound, "Requested API endpoint not found")
	})
}

func (app *App) getOrdersHandler(w http.ResponseWriter, r *http.Request) {
	start, count, err := getOffsetAndCountFromRequest(r)

	if err != nil {
		helpers.RespondWithError(w, http.StatusBadRequest, err.Error())
	}

	helpers.RespondWithJSON(w, http.StatusOK, map[string]int{"count": count, "start": start})

	// orders, err := models.GetOrders(app.Store, start, count)
	// // if err != nil {
	// switch err {
	// case nil:
	// 	utils.RespondWithJSON(w, http.StatusOK, orders)

	// case errors.InvalidOrderSignature:
	// 	utils.RespondWithError(w, http.StatusBadRequest, err.Error())

	// case errors.SignatureAddressMismatch:
	// 	utils.RespondWithError(w, http.StatusBadRequest, err.Error())

	// default:
	// 	utils.RespondWithError(w, http.StatusInternalServerError, err.Error())
	// }
}

func (app *App) getOrderByHashHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	unwrappedHash := common.HexToHash(strings.TrimPrefix(vars["hash"], "0x"))
	hash := wrappers.WrapHash(&unwrappedHash)

	helpers.RespondWithJSON(w, http.StatusOK, map[string]string{"hash": hash.Hex()})

	// order, err := models.GetOrderByHash(app.Store, hash)

	// switch err {
	// case nil:
	// 	utils.RespondWithJSON(w, http.StatusOK, order)

	// case errors.NoOpenOrderFound:
	// 	utils.RespondWithError(w, http.StatusNotFound, err.Error())

	// default:
	// 	utils.RespondWithError(w, http.StatusInternalServerError, errors.InternalServerError.Error())

	// }
}

var errInvalidCountParam = errors.New("Invalid value for `count` parameter")
var errInvalidStartParam = errors.New("Invalid value for `start` parameter")

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
