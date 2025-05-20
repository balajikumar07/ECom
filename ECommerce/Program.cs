using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Ecommerce.Interface;
using Ecommerce.Repository;
using Ecommerce.Helper;

var builder = WebApplication.CreateBuilder(args);


builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(5215);
    serverOptions.ListenAnyIP(7122, listenOptions => listenOptions.UseHttps());
});


builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<ICartProductRepository, CartProductRepository>();
builder.Services.AddScoped<ICustomerAddressRepository, CustomerAddressRepository>();
builder.Services.AddScoped<ICustomerLoginRepository, CustomerLoginRepository>();
builder.Services.AddScoped<ICustomerSignupRepository, CustomerSignupRepository>();
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();

builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductImagesRepository, ProductImagesRepository>();
builder.Services.AddScoped<IProductSearchRepository, ProductSearchRepository>();

builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<ImageHelper>();


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseCors("AllowAll");
app.UseSwagger();
app.UseSwaggerUI();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();