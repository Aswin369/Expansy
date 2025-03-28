function noCache(req, res, next) {
    res.set('Cache-Control', 'no-cache');
    next();  
}
module.exports = noCache