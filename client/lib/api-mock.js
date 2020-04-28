export const test = (data) => {
    return new Promise((resolve, reject) => {
        wx.request({
            url: 'http://127.0.0.1:3000/api/test',
            data,
            success: (res) => {
                resolve({result: res.data});
            },
            fail: reject
        });
    });
};