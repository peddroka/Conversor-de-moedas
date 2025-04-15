document.addEventListener("DOMContentLoaded", function () {
  // Elementos do DOM
  const elements = {
    amountInput: document.getElementById("amount"),
    fromSelect: document.getElementById("from"),
    toSelect: document.getElementById("to"),
    convertBtn: document.getElementById("convert-btn"),
    swapBtn: document.getElementById("swap-btn"),
    resultValue: document.getElementById("result-value"),
    resultInfo: document.getElementById("result-info"),
    updateTime: document.getElementById("update-time"),
  };

  // Estado da aplicação
  const state = {
    rates: {},
    lastUpdate: null,
    baseCurrency: "BRL",
    isLoading: false,
    apiUrl: "https://api.exchangerate-api.com/v4/latest/",
  };

  // Moedas suportadas
  const supportedCurrencies = {
    BRL: "Real Brasileiro",
    USD: "Dólar Americano",
    EUR: "Euro",
    GBP: "Libra Esterlina",
    JPY: "Iene Japonês",
  };

  // Inicialização
  init();

  async function init() {
    populateCurrencyDropdowns();
    setupEventListeners();
    await loadInitialRates();

    // Preenche com valor inicial e converte
    elements.amountInput.value = "1";
    await convertCurrency();
  }

  function populateCurrencyDropdowns() {
    // Preenche os selects com as moedas suportadas
    Object.keys(supportedCurrencies).forEach((currency) => {
      const optionText = `${supportedCurrencies[currency]} (${currency})`;

      const fromOption = new Option(optionText, currency);
      elements.fromSelect.add(fromOption);

      const toOption = new Option(optionText, currency);
      elements.toSelect.add(toOption);
    });

    // Define valores padrão
    elements.fromSelect.value = "BRL";
    elements.toSelect.value = "USD";
  }

  function setupEventListeners() {
    elements.convertBtn.addEventListener("click", convertCurrency);
    elements.amountInput.addEventListener("input", convertCurrency);
    elements.swapBtn.addEventListener("click", swapCurrencies);
    elements.fromSelect.addEventListener("change", handleBaseCurrencyChange);
    elements.toSelect.addEventListener("change", convertCurrency);
  }

  async function loadInitialRates() {
    try {
      startLoading();
      await fetchRates();
    } catch (error) {
      console.error("Erro ao carregar taxas:", error);
      showError("Falha ao carregar dados. Tente novamente.");
    } finally {
      stopLoading();
    }
  }

  async function fetchRates() {
    try {
      const base = elements.fromSelect.value;
      const response = await fetch(`${state.apiUrl}${base}`);

      if (!response.ok) {
        throw new Error(`Erro: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.rates) {
        throw new Error("Dados inválidos da API");
      }

      state.rates = data.rates;
      state.lastUpdate = new Date(data.time_last_updated * 1000);
      state.baseCurrency = base;
      elements.updateTime.textContent = formatDate(state.lastUpdate);

      return data.rates;
    } catch (error) {
      console.error("Erro ao buscar taxas:", error);
      showError("Erro ao atualizar taxas. Tente novamente.");
      throw error;
    }
  }

  async function convertCurrency() {
    try {
      const amount = parseFloat(elements.amountInput.value);

      if (!validateAmount(amount)) return;

      // Garante que temos as taxas atualizadas
      if (
        !state.rates[elements.toSelect.value] ||
        state.baseCurrency !== elements.fromSelect.value
      ) {
        await fetchRates();
      }

      const rate = state.rates[elements.toSelect.value];
      if (!rate) {
        showError("Taxa não disponível");
        return;
      }

      const convertedValue = amount * rate;

      showResult(
        formatCurrency(convertedValue, elements.toSelect.value),
        `1 ${elements.fromSelect.value} = ${rate.toFixed(4)} ${
          elements.toSelect.value
        }`
      );
    } catch (error) {
      console.error("Erro na conversão:", error);
      showError("Erro ao converter. Tente novamente.");
    }
  }

  function validateAmount(amount) {
    if (isNaN(amount) || amount === "") {
      showResult("0.00", "Digite um valor");
      return false;
    }

    if (amount <= 0) {
      showError("Valor deve ser positivo");
      return false;
    }

    return true;
  }

  async function swapCurrencies() {
    // Animação
    elements.swapBtn.classList.add("rotating");
    setTimeout(() => elements.swapBtn.classList.remove("rotating"), 300);

    // Troca as moedas
    [elements.fromSelect.value, elements.toSelect.value] = [
      elements.toSelect.value,
      elements.fromSelect.value,
    ];

    await fetchRates();
    await convertCurrency();
  }

  async function handleBaseCurrencyChange() {
    await fetchRates();
    await convertCurrency();
  }

  // Funções auxiliares de UI
  function startLoading() {
    state.isLoading = true;
    elements.convertBtn.disabled = true;
    elements.convertBtn.textContent = "Carregando...";
  }

  function stopLoading() {
    state.isLoading = false;
    elements.convertBtn.disabled = false;
    elements.convertBtn.textContent = "Converter";
  }

  function showResult(value, info) {
    elements.resultValue.textContent = value;
    elements.resultInfo.textContent = info;
    elements.resultValue.className = "result-value";
    elements.resultInfo.className = "result-info";
  }

  function showError(message) {
    elements.resultValue.textContent = "Erro";
    elements.resultInfo.textContent = message;
    elements.resultValue.className = "result-value error";
    elements.resultInfo.className = "result-info error";
  }

  function formatCurrency(value, currency) {
    try {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    } catch (e) {
      return `${value.toFixed(2)} ${currency}`;
    }
  }

  function formatDate(date) {
    if (!date) return "--/--/---- --:--";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }
});
