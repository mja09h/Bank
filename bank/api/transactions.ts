import api from ".";

const deposit = async (amount: number) => {
  try {
    const { data } = await api.put("/transactions/deposit", { amount });
    return data;
  } catch (error) {
    console.log(error);
  }
};

const withdraw = async (amount: number) => {
  try {
    const { data } = await api.put("/transactions/withdraw", { amount });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const transfer = async (amount: number, username: string) => {
  try {
    const { data } = await api.put(`/transactions/transfer/${username}`, {
      amount,
    });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getMyTransactions = async () => {
  try {
    const { data } = await api.get("/transactions/my");
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export { deposit, withdraw, transfer, getMyTransactions };
