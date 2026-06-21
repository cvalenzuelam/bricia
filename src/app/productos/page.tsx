import { loadShopConfig } from "@/data/shop-config-loader";
import ShopComingSoon from "@/components/productos/ShopComingSoon";
import ProductosCatalog from "@/components/productos/ProductosCatalog";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const shopConfig = await loadShopConfig();

  if (shopConfig.comingSoon) {
    return <ShopComingSoon config={shopConfig} variant="page" />;
  }

  return <ProductosCatalog />;
}
