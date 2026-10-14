import it.registrofamiliare.app.WalletAmountParser;
public class WalletAmountParserTest {
    private static int tests;
    private static void check(String s, Double expected) {
        Double actual=WalletAmountParser.parse(s); tests++;
        if(expected==null ? actual!=null : actual==null || Math.abs(actual-expected)>0.00001)
            throw new AssertionError(s+" expected="+expected+" actual="+actual);
    }
    public static void main(String[] args) {
        check("Wallet 1,99 € GR COMPANY SRL PROSHOP 12:18",1.99);
        check("Hai pagato € 14,17",14.17);
        check("Hai pagato 37\u00a0€",37.0);
        check("Hai pagato €\u202f37",37.0);
        check("Pagamento EUR 1.234,56",1234.56);
        check("Pagamento 1\u202f234,56\u00a0€",1234.56);
        check("Pagamento 1.234 €",1234.0);
        check("Pagamento €1.234",1234.0);
        check("Pagamento EUR 12.50",12.5);
        check("Pagamento 12.50 eur",12.5);
        check("Hai pagato 1,99 presso GR COMPANY",1.99);
        check("Saldo disponibile 123,45 €",null);
        check("Saldo €123,45",null);
        check("Available balance EUR 123.45",null);
        check("Saldo 100 € Hai pagato 1,99 €",1.99);
        check("Saldo aggiornato, pagamento di € 8,70",8.7);
        check("Hai pagato 10 € Saldo disponibile 40 €",10.0);
        check("Carta 1234 ore 12:18 13/10/2026",null);
        check("Ora 12.18.30",null);
        check("0 €",null);
        check("EUR 0.00",null);
        check("Nessun pagamento",null);
        check(null,null);
        check("\u20661,99\u00a0€\u2069",1.99);
        check("Pagamento € 1000001",null);
        check("Pagamento 1234567 €",null);
        System.out.println("PASS "+tests+" money parsing regressions");
    }
}
