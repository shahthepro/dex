CREATE TABLE public.withdraw_signs
(
    tx_hash character varying(132) NOT NULL,
    message_data character varying(210) NOT NULL,
    message_sign character varying(132) NOT NULL,
	signer character varying(42) NOT NULL,
	signed_at TIMESTAMP without time zone
);

-- CREATE INDEX ON public.withdraw_signs USING brin (token, recipient);
-- CREATE INDEX ON public.withdraw_signs USING hash (message_data);
CREATE INDEX ON public.withdraw_signs USING hash (tx_hash);
-- CREATE INDEX ON public.withdraw_signs USING hash (recipient);

SELECT create_hypertable('public.withdraw_signs', 'signed_at');
