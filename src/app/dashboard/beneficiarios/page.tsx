import { BeneficiaryList } from '@/components/beneficiary-list';

export default async function BeneficiariosPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <BeneficiaryList />
    </div>
  );
}
