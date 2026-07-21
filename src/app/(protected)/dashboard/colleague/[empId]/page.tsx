import { ColleagueProfilePageClient } from "@/components/dashboard/my-allocations/ColleagueProfilePageClient";

type PageProps = {
  params: Promise<{ empId: string }>;
};

export default async function DashboardColleagueProfilePage({ params }: PageProps) {
  const { empId } = await params;
  return <ColleagueProfilePageClient empId={empId} />;
}
