import api from ".";

const deposit = async (amount: number) => {
    try {
        const { data } = await api.put("/transactions/deposit", { amount });
        return data;
    } catch (error) {
        console.log(error);
    }
};

export { deposit };