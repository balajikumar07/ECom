using Ecommerce.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Ecommerce.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderStatusController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public OrderStatusController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("{orderId}")]
        public IActionResult GetOrderStatus(int orderId)
        {
            string? connStr = _configuration.GetConnectionString("DefaultConnection");

            using (SqlConnection connection = new SqlConnection(connStr))
            {
                string query = @"
                SELECT 
                    o.OrderID, o.CustomerID, o.ProductID, o.DealerID, o.Quantity, o.OrderDate, o.AddressId,
                    p.ProductName, p.Description, p.Price, p.ImagePath,
                    os.StatusID, os.Status
                FROM Orders o
                JOIN Products p ON o.ProductID = p.ProductID
                LEFT JOIN OrderStatus os ON o.OrderID = os.OrderID
                WHERE o.OrderID = @OrderID";

                SqlCommand cmd = new SqlCommand(query, connection);
                cmd.Parameters.AddWithValue("@OrderID", orderId);

                connection.Open();
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    if (!reader.Read())
                        return NotFound(new { Message = "Order not found." });

                    var result = new
                    {
                        OrderID = (int)reader["OrderID"],
                        CustomerID = (int)reader["CustomerID"],
                        ProductID = (int)reader["ProductID"],
                        DealerID = (int)reader["DealerID"],
                        Quantity = (int)reader["Quantity"],
                        OrderDate = (DateTime)reader["OrderDate"],
                        AddressId = (int)reader["AddressId"],
                        Product = new
                        {
                            ProductName = reader["ProductName"].ToString(),

                            Price = (decimal)reader["Price"],
                            ImagePath = reader["ImagePath"].ToString()
                        },
                        OrderStatus = reader["StatusID"] != DBNull.Value ? new
                        {
                            StatusID = (int)reader["StatusID"],
                            Status = reader["Status"].ToString()
                        } : null
                    };

                    return Ok(result);
                }
            }
        }
    }
}
