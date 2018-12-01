CREATE TABLE public.wallet_balances
(
    wallet character varying(42) NOT NULL,
    token character varying(42) NOT NULL,
    balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
    escrow numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
    UNIQUE (wallet, token)
);

CREATE INDEX ON public.wallet_balances USING hash (wallet);
