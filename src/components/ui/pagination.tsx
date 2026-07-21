"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface TablePaginationProps {
  total: number;
  page: number;
  pageSize?: number;
  itemName?: string;
  paramName?: string;
}

export function TablePagination({
  total,
  page,
  pageSize = 20,
  itemName = "items",
  paramName = "page",
}: TablePaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);

  // Calculate display range
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const createQueryString = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, newPage.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
      <p>
        Showing <span className="font-medium text-foreground">{start}</span> to{" "}
        <span className="font-medium text-foreground">{end}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span> {itemName}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(createQueryString(page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(createQueryString(page + 1))}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
