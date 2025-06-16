export const authRole = async (req, res, next) => {

    const User = req.user
    if (User.role != 'Admin') {
        return res.json({ err: "Admins Only" })
    }
    next()
}