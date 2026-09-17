import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import path from "node:path";

/* The cream certificate, matching the prototype's .cert styling:
   cream ground, navy ink, gold rule, serif name. A4 landscape. */

const CREAM = "#EFEBCE", INK = "#011936", SLATE = "#4C5B61", GOLD = "#EDB671";

const s = StyleSheet.create({
  page: { backgroundColor: CREAM, padding: 48, alignItems: "center", justifyContent: "center" },
  frame: { borderWidth: 1, borderColor: GOLD, width: "100%", height: "100%", alignItems: "center", justifyContent: "center", padding: 36 },
  logo: { width: 64, height: 64, marginBottom: 14 },
  sub: { color: SLATE, letterSpacing: 2.4, textTransform: "uppercase", fontSize: 10 },
  name: { fontFamily: "Times-Roman", fontSize: 30, color: INK, marginTop: 16, marginBottom: 6 },
  track: { color: INK, fontSize: 13, marginTop: 2 },
  line: { height: 1, backgroundColor: GOLD, width: 300, marginTop: 18, marginBottom: 14 },
  small: { color: SLATE, fontSize: 9.5, textAlign: "center", lineHeight: 1.5 },
  date: { color: SLATE, fontSize: 10, marginTop: 10 },
});

export function CertificatePdf({ name, trackName, issuedAt }: { name: string; trackName: string; issuedAt: Date }) {
  const logo = path.join(process.cwd(), "public", "logo-hand-gold.png");
  const date = issuedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <Document title={`Ten Talents Academy — ${trackName}`} author="Ten Talents">
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.frame}>
          <Image src={logo} style={s.logo} />
          <Text style={s.sub}>Certificate of completion</Text>
          <Text style={s.name}>{name}</Text>
          <Text style={s.track}>{trackName}</Text>
          <View style={s.line} />
          <Text style={s.small}>Ten Talents Academy · educational programme · not a regulated qualification</Text>
          <Text style={s.date}>{date}</Text>
        </View>
      </Page>
    </Document>
  );
}
