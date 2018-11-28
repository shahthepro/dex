CREATE TABLE public.signed_txs
(
    token character varying(42) NOT NULL,
    recipient character varying(42) NOT NULL,
    amount numeric NOT NULL,
    tx_hash character varying(66) NOT NULL,
    tx_type integer NOT NULL, -- 0 - Deposit, 1 - Withdraw
	signer character varying(42) NOT NULL,
	signed_at TIMESTAMP without time zone
);

CREATE INDEX ON public.signed_txs USING brin (token, recipient);

SELECT create_hypertable('public.signed_txs', 'signed_at');
