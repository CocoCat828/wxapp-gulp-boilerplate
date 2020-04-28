//填写 env
wx.cloud.init({
    env: ''
});

export const test = () => {
    return wx.cloud.callFunction({
        name: 'test',
        data: {
            a: 1,
            b: 3
        }
    });
};