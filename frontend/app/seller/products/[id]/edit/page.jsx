import ProductForm from '../../../../../components/ProductForm';

export default async function EditProductPage({ params }) {
  const { id } = await params;
  return <ProductForm productId={id} />;
}