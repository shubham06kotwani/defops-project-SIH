module.exports = (actionType) => {
  return (req, res, next) => {
    const timestamp = new Date().toISOString();
    const serviceNumber = req.user ? req.user.serviceNumber : 'SYSTEM_ANONYMOUS';
    
    console.log(`[TACTICAL AUDIT LOG] [${timestamp}] | User: ${serviceNumber} | Action: ${actionType} | IP: ${req.ip}`);
    next();
  };
};