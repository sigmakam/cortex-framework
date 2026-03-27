import { BaseLayout } from "@themes/default/layouts/BaseLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <BaseLayout>{children}</BaseLayout>;
}
