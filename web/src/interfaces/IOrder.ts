export default interface IOrder {
    order_hash: string
    token: string
    base: string
    price: string
    quantity: string
    is_bid: boolean
    created_at: string
    created_by: string
    volume: string
    volume_filled: string
    is_open: boolean
}