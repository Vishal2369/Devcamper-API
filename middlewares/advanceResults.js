const advanceResults = (model, populate) => async (req, res, next) => {
    //Copy of req Query
    let reqQuery = { ...req.query };

    //Fields need to remove from req Query
    let removeQuery = ['select', 'sort', 'page', 'limit'];

    //Removing Fields from req Query
    removeQuery.forEach(val => delete reqQuery[val])

    //Converting query into string
    let queryStr = JSON.stringify(reqQuery);

    //Adding $ sign so that it will become mongoDB operator
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/, match => `$${match}`);

    //query Searching
    let query = model.find(JSON.parse(queryStr));

    //Searching only asked fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query.select(fields);
    }

    //Sorting bootcamps acc to given fields
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query.sort(sortBy)
    } else {
        query.sort('-createdAt');
    }

    //Pagination
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 2;
    let startPoint = (page - 1) * limit;
    let endPoint = page * limit;
    let total = await model.countDocuments();

    query.skip(startPoint).limit(limit);

    if (populate) {
        query = query.populate(populate);
    }
    //Executing Query
    const results = await query;

    let pagination = {};

    if (endPoint < total) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }

    if (startPoint > 0) {
        pagination.pre = {
            page: page - 1,
            limit
        }
    }

    res.advanceResults = {
        success: true,
        count: results.length,
        pagination,
        data: results
    }

    next();
}

module.exports = advanceResults;