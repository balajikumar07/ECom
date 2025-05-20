using Ecommerce.Model;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Ecommerce.Interface
{
    public interface IProductImagesRepository
    {
        Task<List<ProductImages>> GetImagesByProductId(int productId);
        Task<Product> GetProductDetails(int productId);
        Task<bool> AddImagePath(int productId, string imagePath);
    }
}