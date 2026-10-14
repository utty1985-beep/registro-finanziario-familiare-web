package it.registrofamiliare.app;

import java.util.*;
import java.util.regex.*;

/** Money extraction independent of Android, for repeatable regression tests. */
public final class WalletAmountParser {
    private static final String NUMBER = "(?:[0-9]{1,3}(?:[. ][0-9]{3})+(?:,[0-9]{1,2})?|[0-9]{1,6}(?:[,.][0-9]{1,2})?)";
    private static final Pattern PREFIX = Pattern.compile("(?:€|\\bEUR\\b)\\s*(" + NUMBER + ")(?![0-9])", Pattern.CASE_INSENSITIVE);
    private static final Pattern SUFFIX = Pattern.compile("(?<![0-9.,])(" + NUMBER + ")\\s*(?:€|\\bEUR\\b)", Pattern.CASE_INSENSITIVE);
    private static final Pattern DECIMAL = Pattern.compile("(?<![0-9.,:/])([0-9]{1,6}[,.][0-9]{1,2})(?![0-9.,:/])");
    private static final Pattern BALANCE = Pattern.compile("saldo|disponibil|balance|available", Pattern.CASE_INSENSITIVE);
    private static final Pattern PAYMENT = Pattern.compile("pagat|pagament|spes[oa]|acquisto|paid|payment|purchase|addebito", Pattern.CASE_INSENSITIVE);
    private static final class Candidate {
        final int at; final String number;
        Candidate(int at, String number) { this.at = at; this.number = number; }
    }
    private static String normalize(String text) {
        return text.replace('\u00a0',' ').replace('\u202f',' ').replace('\u2007',' ')
            .replaceAll("[\\u200e\\u200f\\u202a-\\u202e\\u2066-\\u2069]", "");
    }
    private static boolean acceptable(String text, int at) {
        String before = text.substring(Math.max(0, at - 32), at);
        Matcher balance = BALANCE.matcher(before);
        int balanceEnd = -1;
        while (balance.find()) balanceEnd = balance.end();
        if (balanceEnd < 0) return true;
        return PAYMENT.matcher(before.substring(balanceEnd)).find();
    }
    private static Double number(String raw) {
        String value = raw.replace(" ", "");
        if (value.indexOf(',') >= 0) value = value.replace(".", "").replace(',', '.');
        else if (value.matches("[0-9]{1,3}(?:\\.[0-9]{3})+")) value = value.replace(".", "");
        try { double amount = Double.parseDouble(value); return amount > 0 && amount <= 1000000 ? amount : null; }
        catch (NumberFormatException e) { return null; }
    }
    public static Double parse(String input) {
        if (input == null) return null;
        String text = normalize(input);
        List<Candidate> candidates = new ArrayList<Candidate>();
        for (Pattern pattern : new Pattern[]{PREFIX, SUFFIX}) {
            Matcher m = pattern.matcher(text);
            while (m.find()) candidates.add(new Candidate(m.start(), m.group(1)));
        }
        Collections.sort(candidates, new Comparator<Candidate>() {
            public int compare(Candidate a, Candidate b) { return Integer.compare(a.at,b.at); }
        });
        for (Candidate c : candidates) if (acceptable(text,c.at)) {
            Double amount = number(c.number); if (amount != null) return amount;
        }
        // Never reinterpret an excluded balance as an unlabelled payment.
        if (!candidates.isEmpty()) return null;
        Matcher m = DECIMAL.matcher(text);
        while (m.find()) if (acceptable(text,m.start())) {
            Double amount = number(m.group(1)); if (amount != null) return amount;
        }
        return null;
    }
}
