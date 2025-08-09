
import ReactFlatpickr, { type DateTimePickerProps } from 'react-flatpickr'

const DateFormInput = ({ className, options, placeholder, value, ...restProps }: DateTimePickerProps) => {
  return <ReactFlatpickr className={className} value={value} options={options} placeholder={placeholder} {...restProps} />
}

export default DateFormInput
