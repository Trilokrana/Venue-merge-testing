"use client"
import { UseUserResult } from "@/hooks/use-user"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import { LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { isPublicPath } from "@/lib/supabase/proxy"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

const UserProfile = ({ className, user }: { className?: string; user: UseUserResult }) => {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          className={cn(
            "inline-flex items-center ring-0 focus-visible:ring-0 justify-center px-4 py-2 rounded-full border bg-background text-sm font-medium transition-all hover:bg-muted",
            className
          )}
        >
          <Avatar className="h-10 w-10 rounded-full border-none">
            <AvatarImage src={user?.user?.user_metadata?.avatar_url} alt={"vkjab"} />
            <AvatarFallback className="rounded-full">
              {user?.user?.user_metadata?.first_name?.charAt(0)}
              {user?.user?.user_metadata?.last_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={user?.user?.user_metadata?.avatar_url}
                alt={
                  user?.user?.user_metadata?.first_name + " " + user?.user?.user_metadata?.last_name
                }
              />
              <AvatarFallback className="rounded-lg">
                {user?.user?.user_metadata?.first_name?.charAt(0)}
                {user?.user?.user_metadata?.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {user?.user?.user_metadata?.first_name} {user?.user?.user_metadata?.last_name}
              </span>
              <span className="truncate text-xs">{user?.user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={async () => {
            try {
              await getSupabaseBrowserClient()?.auth.signOut()
              if (!isPublicPath(pathname)) {
                router.push("/login")
              }
              queryClient.invalidateQueries({
                queryKey: ["user"],
              })
            } catch (error) {
              toast.error((error as Error).message)
              console.error(error)
            }
          }}
        >
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserProfile
