CREATE TABLE public.orders
(
	order_hash character varying(66) NOT NULL,
    token character varying(42) NOT NULL,
    base character varying(42) NOT NULL,
    price numeric NOT NULL CHECK (price >= 0),
    quantity numeric NOT NULL CHECK (quantity >= 0),
    is_bid boolean NOT NULL,
	created_at TIMESTAMP without time zone NOT NULL,
	created_by character varying(42) NOT NULL,
	volume numeric NOT NULL CHECK (volume > 0),
    volume_filled numeric DEFAULT 0 CHECK ((volume_filled >= 0) AND (volume_filled <= volume)),
	is_open boolean DEFAULT true
);

-- CREATE INDEX ON public.orders USING brin (base, token);
CREATE INDEX ON public.orders USING brin (base, token, price);
CREATE INDEX ON public.orders USING hash (created_by);
CREATE INDEX ON public.orders USING hash (order_hash);

SELECT create_hypertable('public.orders', 'created_at');