import RoleBasedRenderer from "@/components/common/RoleBasedRenderer"
import RenteeDashboardPage from "@/components/rentee/pages/RenteeDashboardPage"
import OwnerDashboardPage from "@/components/venue-onwer/pages/OwnerDashboardPage"
import DashboardLoading from "./loading"

export default function DashboardPage() {
  return (
    <RoleBasedRenderer
      venueOwnerComponent={<OwnerDashboardPage />}
      renteeComponent={<RenteeDashboardPage />}
      loadingFallback={<DashboardLoading />}
    />
  )
}
