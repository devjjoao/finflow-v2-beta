// -----------------------------------------------------------------------
// FinFlow — funções puras para análise, recorte e resumo mensal ("Meu mês")
// -----------------------------------------------------------------------

/**
 * Retorna a chave do mês atual no fuso local do usuário no formato "YYYY-MM".
 * Evita o deslocamento de timezone de toISOString().
 */
export function getLocalCurrentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Retorna a chave do mês anterior a partir de uma chave "YYYY-MM".
 */
export function getPreviousMonthKey(monthKey) {
  if (!monthKey) return getLocalCurrentMonthKey();
  const [yearStr, monthStr] = monthKey.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Retorna a chave do próximo mês a partir de uma chave "YYYY-MM".
 */
export function getNextMonthKey(monthKey) {
  if (!monthKey) return getLocalCurrentMonthKey();
  const [yearStr, monthStr] = monthKey.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Verifica se uma chave "YYYY-MM" é posterior ao mês atual local.
 */
export function isFutureMonth(monthKey) {
  const currentKey = getLocalCurrentMonthKey();
  return monthKey > currentKey;
}

/**
 * Formata "YYYY-MM" para exibição em português capitalizado (ex.: "Outubro 2026").
 */
export function formatMonthLabel(monthKey) {
  if (!monthKey) return "";
  const [yearStr, monthStr] = monthKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  // Usa o dia 15 no construtor local para evitar bordas de UTC
  const date = new Date(year, month - 1, 15);
  const monthName = date.toLocaleDateString("pt-BR", { month: "long" });
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalized} ${year}`;
}

/**
 * Filtra transações pelo mês especificado (Timezone-safe via string slice).
 */
export function filterTransactionsByMonth(transactions = [], monthKey) {
  if (!monthKey) return [];
  return transactions.filter((t) => t?.date && t.date.slice(0, 7) === monthKey);
}

/**
 * Calcula totais do mês: receitas, despesas, saldo e valor economizado.
 *
 * O parâmetro opcional `untilDay` limita o cálculo aos lançamentos até aquele
 * dia do mês (inclusive). Sem ele, a função considera o mês inteiro, como antes.
 * É usado para comparar o mês atual com o mesmo período do mês anterior.
 */
export function calculateMonthTotals(transactions = [], monthKey, untilDay = null) {
  let monthItems = filterTransactionsByMonth(transactions, monthKey);
  if (untilDay) {
    monthItems = monthItems.filter(
      (t) => parseInt(t.date.slice(8, 10), 10) <= untilDay
    );
  }
  const receitas = monthItems
    .filter((t) => t.type === "entrada")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const despesas = monthItems
    .filter((t) => t.type === "saida")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const saldo = receitas - despesas;
  const economizado = Math.max(0, saldo);
  const taxaPoupanca = receitas > 0 && saldo > 0 ? (saldo / receitas) * 100 : 0;

  return {
    monthKey,
    count: monthItems.length,
    receitas,
    despesas,
    saldo,
    economizado,
    taxaPoupanca,
  };
}

/**
 * Compara totais do mês atual com o mês anterior.
 */
export function calculateMonthComparison(currentTotals, previousTotals) {
  const hasCurrentData = (currentTotals?.count || 0) > 0;
  const hasPreviousData = (previousTotals?.count || 0) > 0;

  // Se o mês atual ou o anterior não possui lançamentos, não calcula percentuais de variação
  if (!hasCurrentData || !hasPreviousData) {
    return {
      diffDespesas: 0,
      pctDespesas: null,
      diffSaldo: 0,
      pctSaldo: null,
      hasCurrentData,
      hasPreviousData,
    };
  }

  const diffDespesas = currentTotals.despesas - previousTotals.despesas;
  let pctDespesas = null;
  if (previousTotals.despesas > 0 && currentTotals.despesas > 0) {
    pctDespesas = (diffDespesas / previousTotals.despesas) * 100;
  }

  const diffSaldo = currentTotals.saldo - previousTotals.saldo;
  let pctSaldo = null;
  if (previousTotals.saldo !== 0 && currentTotals.saldo !== 0) {
    pctSaldo = (diffSaldo / Math.abs(previousTotals.saldo)) * 100;
  }

  return {
    diffDespesas,
    pctDespesas,
    diffSaldo,
    pctSaldo,
    hasCurrentData,
    hasPreviousData,
  };
}

/**
 * Retorna as principais categorias de despesa do mês ordenadas por valor.
 */
export function calculateTopCategories(transactions = [], monthKey, limit = 5) {
  const monthItems = filterTransactionsByMonth(transactions, monthKey);
  const saidas = monthItems.filter((t) => t.type === "saida");
  const totalSaidas = saidas.reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const map = {};
  saidas.forEach((t) => {
    const cat = t.category || "Outros";
    map[cat] = (map[cat] || 0) + Number(t.amount || 0);
  });

  const list = Object.entries(map).map(([category, total]) => ({
    category,
    total,
    percentage: totalSaidas > 0 ? (total / totalSaidas) * 100 : 0,
  }));

  list.sort((a, b) => b.total - a.total);
  return list.slice(0, limit);
}

/**
 * Calcula contas previstas ainda não pagas no mês atual:
 * 1. Faturas de cartão de crédito não pagas.
 * 2. Lançamentos com data futura dentro do mês atual.
 */
export function calculatePendingBills({
  transactions = [],
  cards = [],
  paidState = {},
  monthKey = getLocalCurrentMonthKey(),
  referenceDate = new Date(),
}) {
  const pendingItems = [];
  let totalPending = 0;

  const todayStr = `${referenceDate.getFullYear()}-${String(
    referenceDate.getMonth() + 1
  ).padStart(2, "0")}-${String(referenceDate.getDate()).padStart(2, "0")}`;

  // 1. Faturas de cartão
  cards.forEach((card) => {
    const key = `${card.id}-${monthKey}`;
    const isPaid = Boolean(paidState[key]);
    if (!isPaid) {
      const cardTransactions = transactions.filter(
        (t) =>
          t.cardId === card.id &&
          t.type === "saida" &&
          t.date &&
          t.date.slice(0, 7) === monthKey
      );
      const invoiceTotal = cardTransactions.reduce(
        (acc, t) => acc + Number(t.amount || 0),
        0
      );
      if (invoiceTotal > 0) {
        pendingItems.push({
          id: `card-${card.id}`,
          title: `Fatura ${card.name}`,
          type: "card",
          color: card.color || "#3b82f6",
          amount: invoiceTotal,
          dueDay: card.dueDay || null,
          dueDateStr: card.dueDay
            ? `${monthKey}-${String(card.dueDay).padStart(2, "0")}`
            : null,
        });
        totalPending += invoiceTotal;
      }
    }
  });

  // 2. Lançamentos com data futura no mês que não são de cartão (evita duplicar com a fatura)
  const futureTransactions = transactions.filter(
    (t) =>
      t.type === "saida" &&
      !t.cardId &&
      t.date &&
      t.date.slice(0, 7) === monthKey &&
      t.date > todayStr
  );

  futureTransactions.forEach((t) => {
    pendingItems.push({
      id: t.id,
      title: t.description || t.category || "Despesa agendada",
      type: "scheduled",
      color: "#f43f5e",
      amount: Number(t.amount || 0),
      dueDay: parseInt(t.date.slice(8, 10), 10),
      dueDateStr: t.date,
    });
    totalPending += Number(t.amount || 0);
  });

  // Ordena por dia de vencimento crescente
  pendingItems.sort((a, b) => (a.dueDay || 99) - (b.dueDay || 99));

  return {
    items: pendingItems,
    totalPending,
  };
}

/**
 * Calcula quanto o usuário pode gastar por dia até o fim do mês:
 * Fórmula: (saldoDisponivel - contasPrevistas) / diasRestantes
 * Dias restantes: max(1, totalDiasDoMes - diaAtual + 1)
 */
export function calculateDailyBudget({
  saldoDisponivel,
  contasPrevistas = 0,
  referenceDate = new Date(),
}) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const currentDay = referenceDate.getDate();

  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

  const saldoLiquido = Number(saldoDisponivel || 0) - Number(contasPrevistas || 0);

  if (saldoLiquido <= 0) {
    return {
      dailyAmount: 0,
      daysRemaining,
      totalDaysInMonth,
      currentDay,
      saldoLiquido,
      isDeficit: saldoLiquido < 0,
      status: "esgotado",
    };
  }

  const dailyAmount = saldoLiquido / daysRemaining;

  return {
    dailyAmount,
    daysRemaining,
    totalDaysInMonth,
    currentDay,
    saldoLiquido,
    isDeficit: false,
    status: "disponivel",
  };
}

/**
 * Gera de 3 a 5 insights automáticos determinísticos com base nos dados reais do usuário.
 */
export function generateDeterministicInsights({
  currentTotals,
  previousTotals,
  comparison,
  topCategories = [],
  pendingBills = { items: [], totalPending: 0 },
  dailyBudget,
}) {
  const insights = [];

  // Insight 1: Comparativo com o mesmo período do mês anterior (apenas com movimentações reais em ambos os meses)
  if (
    currentTotals?.count > 0 &&
    currentTotals.despesas > 0 &&
    previousTotals?.count > 0 &&
    previousTotals.despesas > 0 &&
    comparison?.pctDespesas !== null
  ) {
    const pct = Math.abs(Math.round(comparison.pctDespesas));
    if (comparison.diffDespesas > 0) {
      insights.push(`Você gastou ${pct}% a mais do que no mesmo período do mês anterior.`);
    } else if (comparison.diffDespesas < 0) {
      insights.push(`Você gastou ${pct}% a menos do que no mesmo período do mês anterior.`);
    } else {
      insights.push(`Seus gastos estão no mesmo patamar do mesmo período do mês anterior.`);
    }
  }

  // Insight 2: Principal categoria de gasto
  if (topCategories.length > 0 && currentTotals.despesas > 0) {
    const top = topCategories[0];
    const pct = Math.round(top.percentage);
    insights.push(
      `A categoria ${top.category} concentra ${pct}% de todas as suas despesas este mês.`
    );
  }

  // Insight 3: Contas previstas pendentes
  if (pendingBills.totalPending > 0) {
    const formatted = pendingBills.totalPending.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    insights.push(`Restam ${formatted} em contas previstas para serem pagas até o fim do mês.`);
  } else if (currentTotals.despesas > 0) {
    insights.push(`Todas as contas e faturas previstas para este mês já constam como pagas.`);
  }

  // Insight 4: Taxa de economia ou status do saldo
  if (currentTotals.count > 0 && currentTotals.receitas > 0) {
    if (currentTotals.saldo > 0) {
      const pct = Math.round(currentTotals.taxaPoupanca);
      insights.push(`Você já economizou ${pct}% da sua receita total deste mês.`);
    } else if (currentTotals.saldo < 0) {
      const deficit = Math.abs(currentTotals.saldo).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      insights.push(`Suas despesas ultrapassaram suas receitas este mês em ${deficit}.`);
    }
  }

  // Insight 5: Limite diário saudável
  if (dailyBudget && dailyBudget.dailyAmount > 0) {
    const formatted = dailyBudget.dailyAmount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    insights.push(`Mantendo seu ritmo, seu limite saudável para gastar é de ${formatted} por dia.`);
  }

  // Fallback caso haja poucos dados cadastrados
  if (insights.length === 0) {
    insights.push("Nenhuma movimentação financeira registrada para este mês.");
    insights.push("Cadastre seus lançamentos para desbloquear comparativos e insights.");
  } else if (insights.length < 2) {
    insights.push("Cadastre mais lançamentos de entradas e saídas para desbloquear comparações detalhadas.");
  }

  return insights.slice(0, 5);
}