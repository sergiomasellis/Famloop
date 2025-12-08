"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  CalendarDays,
  ListTodo,
  Trophy,
  Shield,
  LogIn,
  UserPlus,
  LogOut,
  Tag,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 touch-manipulation">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:px-4">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0" aria-label="FamLoop Home">
          <Image
            src="/logo.png"
            alt="FamLoop"
            width={60}
            height={60}
            className="dark:invert"
          />
        </Link>

        {isAuthenticated && (
          <>
            <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

            <nav className="hidden md:block" role="navigation" aria-label="Primary">
              <NavigationMenu>
                <NavigationMenuList className="gap-2">
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className="group h-10 w-max flex-row items-center justify-center rounded-md border-2 border-transparent bg-background px-4 py-2 text-sm font-bold transition-all hover:border-border hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] focus:border-border focus:shadow-[2px_2px_0px_0px_var(--shadow-color)] focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 [&_svg]:size-4 [&_svg]:shrink-0">
                      <Link href="/dashboard" className="flex items-center gap-2" prefetch={false}>
                        <CalendarDays className="size-4" />
                        <span className="hidden sm:inline">DASHBOARD</span>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className="group h-10 w-max flex-row items-center justify-center rounded-md border-2 border-transparent bg-background px-4 py-2 text-sm font-bold transition-all hover:border-border hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] focus:border-border focus:shadow-[2px_2px_0px_0px_var(--shadow-color)] focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 [&_svg]:size-4 [&_svg]:shrink-0">
                      <Link href="/leaderboard" className="flex items-center gap-2" prefetch={false}>
                        <Trophy className="size-4" />
                        <span className="hidden sm:inline">LEADERBOARD</span>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink asChild className="group h-10 w-max flex-row items-center justify-center rounded-md border-2 border-transparent bg-background px-4 py-2 text-sm font-bold transition-all hover:border-border hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] focus:border-border focus:shadow-[2px_2px_0px_0px_var(--shadow-color)] focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 [&_svg]:size-4 [&_svg]:shrink-0">
                      <Link href="/chores" className="flex items-center gap-2" prefetch={false}>
                        <ListTodo className="size-4" />
                        <span className="hidden sm:inline">CHORES</span>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                </NavigationMenuList>
              </NavigationMenu>
            </nav>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="flex md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="touch-manipulation" aria-label="Open Menu">
                      <Menu className="size-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 sm:w-80">
                    <SheetHeader className="border-b-2 border-border pb-4">
                      <SheetTitle>NAVIGATION</SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-2 mt-6 px-4" role="navigation" aria-label="Mobile Navigation">
                      <SheetClose asChild>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-4 py-3 rounded-md border-2 border-transparent bg-background text-sm font-bold uppercase transition-all hover:border-border hover:bg-accent hover:text-accent-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-left"
                        >
                          <CalendarDays className="size-5 shrink-0" />
                          <span>DASHBOARD</span>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/leaderboard"
                          className="flex items-center gap-3 px-4 py-3 rounded-md border-2 border-transparent bg-background text-sm font-bold uppercase transition-all hover:border-border hover:bg-accent hover:text-accent-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-left"
                        >
                          <Trophy className="size-5 shrink-0" />
                          <span>LEADERBOARD</span>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          href="/chores"
                          className="flex items-center gap-3 px-4 py-3 rounded-md border-2 border-transparent bg-background text-sm font-bold uppercase transition-all hover:border-border hover:bg-accent hover:text-accent-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-left"
                        >
                          <ListTodo className="size-5 shrink-0" />
                          <span>CHORES</span>
                        </Link>
                      </SheetClose>
                      <Separator className="my-2" />
                      <SheetClose asChild>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-3 rounded-md border-2 border-transparent bg-background text-sm font-bold uppercase transition-all hover:border-border hover:bg-destructive hover:text-destructive-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none text-left w-full"
                        >
                          <LogOut className="size-5 shrink-0" />
                          <span>LOGOUT</span>
                        </button>
                      </SheetClose>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="touch-manipulation">
                    <Avatar className="size-8">
                      <AvatarImage src={user?.profile_image_url || undefined} alt={user?.name || "User"} />
                      <AvatarFallback>
                        {user ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      {user?.email && (
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/billing">Billing</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/pricing">
                  <Tag className="mr-2 size-4" />
                  Pricing
                </Link>
              </Button>
              <Button variant="outline" asChild className="hidden sm:inline-flex">
                <Link href="/auth/login">
                  <LogIn className="mr-2 size-4" />
                  Log in
                </Link>
              </Button>
              <Button asChild className="hidden sm:inline-flex">
                <Link href="/auth/signup">
                  <UserPlus className="mr-2 size-4" />
                  Sign up
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;