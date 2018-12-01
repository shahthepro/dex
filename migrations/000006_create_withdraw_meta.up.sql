CREATE TABLE public.withdraw_meta
(
    token character varying(42) NOT NULL,
    recipient character varying(42) NOT NULL,
    amount numeric NOT NULL,
    tx_hash character varying(66) NOT NULL,
    message_data character varying(106) NOT NULL,
    withdraw_status int DEFAULT 0 -- 0 - Signing, 1 - Ready, 2 - Withdrawn
);

CREATE INDEX ON public.withdraw_meta USING hash (message_data);
CREATE INDEX ON public.withdraw_meta USING hash (recipient);
