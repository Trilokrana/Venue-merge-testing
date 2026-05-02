import { BookingWithRelations } from "../bookings/types"

export type RenteeKPIs = {
  upcoming_bookings: number
  pending_requests: number
  total_spent: number
}

export type OwnerKPIs = {
  upcoming_bookings: number
  pending_requests: number
  total_earnings: number
  total_venues: number
  bookings_this_month: {
    count: number
    data: BookingWithRelations[]
  }
}
