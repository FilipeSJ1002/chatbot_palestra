function filtrarEventos(eventos, filtro) {
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  return eventos.filter(evento => {
    const data = new Date(evento.date);
    switch (filtro) {
      case 'hoje':
        return data.toDateString() === hoje.toDateString();
      case 'amanha':
        return data.toDateString() === amanha.toDateString();
      default:
        return true;
    }
  });
}

module.exports = { filtrarEventos };
