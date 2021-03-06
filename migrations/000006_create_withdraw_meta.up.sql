CREATE TABLE public.withdraw_meta
(
    token character varying(42) NOT NULL,
    recipient character varying(42) NOT NULL,
    amount numeric NOT NULL,
    tx_hash character varying(66) NOT NULL,
    -- message_data character varying(210) NOT NULL,
    withdraw_status int DEFAULT 0 -- 0 - Created, 1 - Signed, 2 - Processed
);

CREATE INDEX ON public.withdraw_meta USING hash (tx_hash);
CREATE INDEX ON public.withdraw_meta USING hash (recipient);
