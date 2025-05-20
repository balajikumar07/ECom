// jwtutils.js
const JWTUtils = {
    decode: function(token) {
      try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
      } catch (e) {
        console.error("JWT decode error:", e);
        return null;
      }
    },
  
    getCustomerId: function() {
      const token = localStorage.getItem("token");
      if (!token) return null;
      
      const decoded = this.decode(token);
      return decoded?.customerId || null;
    },
  
    isTokenValid: function() {
      const token = localStorage.getItem("token");
      if (!token) return false;
      
      const decoded = this.decode(token);
      if (!decoded || !decoded.exp) return false;
      
      return decoded.exp > Math.floor(Date.now() / 1000);
    }
  };