CREATE TABLE public.signed_withdrawals
(
    token character varying(42) NOT NULL,
    recipient character varying(42) NOT NULL,
    amount numeric NOT NULL,
    messageHash character varying(138) NOT NULL,
    tx_hash character varying(66) NOT NULL,
	signer character varying(42) NOT NULL,
	signed_at TIMESTAMP without time zone
);

CREATE INDEX ON public.signed_withdrawals USING brin (token, recipient);

SELECT create_hypertable('public.signed_withdrawals', 'signed_at');
