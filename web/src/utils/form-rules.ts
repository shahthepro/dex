export default {
	required(value) {
		return (value != null && value.length > 0) || 'This is required'
	},
	number(value) {
		return (value != null && value.length > 0 && /^[0-9]*\.?[0-9]+$/.test(value)) || `Please enter a valid number`
	}
}
