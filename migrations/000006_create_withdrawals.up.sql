CREATE TABLE public.withdrawals
(
    token character varying(42) NOT NULL,
    recipient character varying(42) NOT NULL,
    amount numeric NOT NULL,
    tx_hash character varying(66) NOT NULL,
	sign_count integer DEFAULT 0,
	created_at TIMESTAMP without time zone,
	last_signed_at TIMESTAMP without time zone,
    completed boolean DEFAULT false
);

CREATE INDEX ON public.withdrawals USING brin (token, recipient);

SELECT create_hypertable('public.withdrawals', 'created_at');
