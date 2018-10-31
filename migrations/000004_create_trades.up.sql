CREATE TABLE public.trades
(
	buy_order_hash character varying(66) NOT NULL,
	sell_order_hash character varying(66) NOT NULL,
    buyer character varying(42) NOT NULL,
    seller character varying(42) NOT NULL,
    token character varying(42) NOT NULL,
    base character varying(42) NOT NULL,
    price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
	volume numeric NOT NULL DEFAULT 0 CHECK (volume > 0),
	traded_at TIMESTAMP without time zone NOT NULL,
	created_by character varying(42) NOT NULL,
    tx_hash character varying(66) NOT NULL
);

CREATE INDEX ON public.trades USING brin (base, token);

SELECT create_hypertable('public.trades', 'traded_at');
