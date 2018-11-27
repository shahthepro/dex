CREATE TABLE public.deposits
(
    token character varying(42) NOT NULL,
    recipient character varying(42) NOT NULL,
    amount numeric NOT NULL,
    tx_hash character varying(66) NOT NULL,
	sign_count integer DEFAULT 0,
	created_at TIMESTAMP without time zone,
	last_signed_at TIMESTAMP without time zone,
    tx_status integer DEFAULT 0 -- 0 - Created, 1 - Signed, 2 - Completed
);

CREATE INDEX ON public.deposits USING brin (token, recipient);

SELECT create_hypertable('public.deposits', 'created_at');
