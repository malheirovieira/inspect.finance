import { SectionPageTitle } from '@/components/dashboard/SectionPageTitle';

interface EmptyPageProps {
  title: string;
}

export function EmptyPage({ title }: EmptyPageProps) {
  return (
    <div className="page-view">
      <SectionPageTitle title={title} />
      <div className="empty-page-body">
        <p>Esta área estará disponível em breve.</p>
      </div>
    </div>
  );
}
