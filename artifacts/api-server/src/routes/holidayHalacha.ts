import { Router } from "express";

const router = Router();

interface HolidayHalacha {
  source: string;
  preparations: string[];
}

const HOLIDAY_HALACHA: Record<string, HolidayHalacha> = {
  "Rosh Hashanah": {
    source: "Yalkut Yosef, Orach Chaim 581–600",
    preparations: [
      "Recite Selichot each morning from Rosh Chodesh Elul. Those who cannot wake before dawn may recite them after Shacharit. Enter Rosh HaShanah with sincere repentance (teshuvah) and review of one's deeds.",
      "Immerse in a mikveh on Erev Rosh HaShanah to welcome the Day of Judgment in purity — an important Sephardic practice.",
      "Perform Hatarat Nedarim (annulment of vows) before mincha on Erev Rosh HaShanah before three men acting as a beit din.",
      "Prepare the simanim (symbolic foods) for the Rosh HaShanah seder: apple and honey, pomegranate seeds, fish, leek, beets, dates, and a gourd. Yalkut Yosef gives specific blessings for each one.",
      "Dress in white garments to symbolise purity and divine forgiveness — a Sephardic custom cited in Yalkut Yosef.",
    ],
  },
  "Yom Kippur": {
    source: "Yalkut Yosef, Orach Chaim 604–624",
    preparations: [
      "Eat a full and joyous seudah on Erev Yom Kippur — this itself is a positive Torah mitzvah. Include meat and wine in the meal.",
      "Perform Kapparot on Erev Yom Kippur morning. Yalkut Yosef (following Maran) prefers using money donated to charity over a chicken, to avoid concerns of cruelty.",
      "Immerse in the mikveh during the afternoon of Erev Yom Kippur before the fast begins.",
      "Recite personal Vidui (confession) at home before Kol Nidre, then again throughout the day's prayers. Review the year's actions with sincere resolve to improve.",
      "Light candles with the blessing לְהַדְלִיק נֵר שֶׁל יוֹם הַכִּפּוּרִים and light a 25-hour ner neshamah for departed relatives before the fast begins.",
    ],
  },
  "Sukkot": {
    source: "Yalkut Yosef, Orach Chaim 625–669",
    preparations: [
      "Begin building the sukkah immediately after Yom Kippur — even on the same night — to fulfil the mitzvah with eagerness. The schach must be valid plant material.",
      "Purchase the Arba Minim before Sukkot. Yalkut Yosef rules: the etrog must be unblemished (preferably from Israel); the lulav must be straight and closed; hadassim must have triple leaves; aravot must be fresh and uncut.",
      "Decorate the sukkah beautifully (noi sukkah). Once hung, these decorations become muktzeh for the duration of the holiday and may not be removed.",
      "Eat all meals in the sukkah. Men are obligated to eat in the sukkah; women are exempt but fulfil a mitzvah when they do. If rain makes it uncomfortable one may eat inside.",
      "Invite the Ushpizin (Avraham, Yitzchak, Yaakov, Moshe, Aharon, Yosef, David) each day with the traditional Aramaic formula.",
    ],
  },
  "Shemini Atzeret": {
    source: "Yalkut Yosef, Orach Chaim 668–670",
    preparations: [
      "Shemini Atzeret is an independent Yom Tov following Sukkot. One still eats in the sukkah without reciting a blessing on it (in Israel).",
      "Begin reciting Geshem (prayer for rain) in Musaf of Shemini Atzeret. From this point, the phrase Mashiv HaRuach U'Morid HaGeshem is added to the Amidah.",
      "Prepare for Simchat Torah (observed the same day in Israel): arrange hakafot (circuits with the Torah) and rejoice with singing and dancing.",
    ],
  },
  "Simchat Torah": {
    source: "Yalkut Yosef, Orach Chaim 669",
    preparations: [
      "Prepare for Hakafot — seven joyous circuits around the bimah carrying the Torah scrolls. This is the greatest expression of love for Torah.",
      "Complete and immediately restart the annual Torah reading cycle: finish Devarim (V'Zot HaBracha) and begin Bereshit. Yalkut Yosef rules all Torah scrolls should be removed from the Aron.",
      "Honour distinguished members of the community as Chatan Torah and Chatan Bereshit — the recipients of the final and first Torah readings.",
    ],
  },
  "Chanukah": {
    source: "Yalkut Yosef, Orach Chaim 670–685",
    preparations: [
      "Prepare a valid Chanukiyah with enough olive oil and cotton wicks for each night. Yalkut Yosef rules olive oil is ideal; candles are acceptable. Each light must burn for at least 30 minutes after nightfall.",
      "Place the Chanukiyah in a doorway or window visible to the public to publicise the miracle (pirsumei nisa). It should be within 10 tefachim (≈80 cm) from the ground unless there is a security concern.",
      "Learn Al HaNissim, which is added in the Modim blessing of the Amidah and in Birkat HaMazon after HaRachaman for all eight days.",
      "Prepare doughnuts (sufganiyot) or latkes fried in oil to commemorate the miracle of the oil. Yalkut Yosef notes this as an accepted Sephardic practice.",
      "Inspect your mezuzot before Chanukah — these auspicious days are an appropriate time for this mitzvah.",
    ],
  },
  "Purim": {
    source: "Yalkut Yosef, Orach Chaim 686–697",
    preparations: [
      "Observe the Fast of Esther (Ta'anit Esther) on the day before Purim from dawn to nightfall. Pregnant or nursing women and those who are ill are exempt.",
      "Arrange access to a kosher handwritten Megillat Esther scroll. Yalkut Yosef rules one must hear every single word of the Megillah — if even one word is missed, one must hear it again.",
      "Prepare Mishloach Manot: at least two different ready-to-eat foods in one package to send to at least one Jewish friend on Purim day.",
      "Set aside Matanot L'Evyonim: separate gifts for at least two different poor people on Purim day. Yalkut Yosef rules giving money directly is preferable to food.",
      "Prepare a festive seudah for Purim afternoon. Yalkut Yosef rules wine must flow at the meal. One who cannot drink much may drink a little and sleep — during sleep one is beyond the distinction of Haman and Mordechai.",
    ],
  },
  "Passover": {
    source: "Yalkut Yosef, Orach Chaim 429–477",
    preparations: [
      "Sell all chametz through a rabbi (mechirat chametz) before the fifth halachic hour on Erev Pesach. The sale must be a complete and genuine legal transaction.",
      "Perform Bedikat Chametz on the night of 14 Nissan by candlelight. Ten pieces of bread are traditionally hidden beforehand. Afterwards recite Kol Chamira to nullify any remaining chametz.",
      "Burn all remaining chametz (Biur Chametz) by the fifth halachic hour on Erev Pesach morning, then recite Kol Chamira again.",
      "Prepare the Seder plate: Maror (romaine lettuce, preferred by Yalkut Yosef), Charoset (dates, nuts, wine — Sephardic recipe), Karpas, Zeroa (roasted bone), and a boiled egg.",
      "Prepare four cups of wine per adult — preferably red Israeli wine — and ensure all participants can recline. The head of the Seder should wear a kittel.",
    ],
  },
  "Pesach": {
    source: "Yalkut Yosef, Orach Chaim 429–477",
    preparations: [
      "Sell all chametz through a rabbi (mechirat chametz) before the fifth halachic hour on Erev Pesach. The sale must be a complete and genuine legal transaction.",
      "Perform Bedikat Chametz on the night of 14 Nissan by candlelight. Ten pieces of bread are traditionally hidden beforehand. Afterwards recite Kol Chamira to nullify any remaining chametz.",
      "Burn all remaining chametz (Biur Chametz) by the fifth halachic hour on Erev Pesach morning, then recite Kol Chamira again.",
      "Prepare the Seder plate: Maror (romaine lettuce, preferred by Yalkut Yosef), Charoset (dates, nuts, wine — Sephardic recipe), Karpas, Zeroa (roasted bone), and a boiled egg.",
      "Prepare four cups of wine per adult — preferably red Israeli wine — and ensure all participants can recline. The head of the Seder should wear a kittel.",
    ],
  },
  "Shavuot": {
    source: "Yalkut Yosef, Orach Chaim 494–496",
    preparations: [
      "Prepare for Tikkun Leil Shavuot — an all-night Torah learning vigil covering Torah, Mishna, Talmud, and Zohar. Yalkut Yosef calls this an obligation of the highest importance for Sephardim.",
      "Prepare dairy foods for the day meals. After eating dairy, one must wait and clean the palate before eating meat. Yalkut Yosef rules the standard Sephardic waiting time applies.",
      "Decorate the synagogue and home with flowers and greenery — an accepted Sephardic minhag to honour the day the Torah was given.",
      "Prepare for the reading of Megillat Ruth and the public reading of the Aseret HaDibrot (Ten Commandments). Yalkut Yosef rules the congregation stands for the Ten Commandments.",
      "Count the final days of the Omer carefully. Yalkut Yosef rules one who forgot to count an entire day may still continue counting without a blessing.",
    ],
  },
  "Tisha B'Av": {
    source: "Yalkut Yosef, Orach Chaim 549–559",
    preparations: [
      "Eat the Seudah HaMafseket (final pre-fast meal) on Erev Tisha B'Av before sunset while seated low. It consists only of bread, a cold hard-boiled egg, and water — eaten alone in mourning.",
      "Remove leather shoes before the fast begins. The five Tisha B'Av afflictions: no eating or drinking, no bathing, no anointing, no marital relations, no leather shoes.",
      "Suspend Torah study before the fast — only mournful texts are permitted: Lamentations (Eicha), Iyov (Job), dark passages in Yirmiyahu, and Tisha B'Av halachot.",
      "Prepare Kinot books for the Shacharit service and Eicha for Ma'ariv. Sitting on a low chair or floor throughout Tisha B'Av is the Sephardic practice cited in Yalkut Yosef.",
      "Sephardim may put on tefillin with a blessing at Mincha (not at Shacharit) on Tisha B'Av — a ruling unique to Maran and cited by Yalkut Yosef.",
    ],
  },
  "Rosh Chodesh": {
    source: "Yalkut Yosef, Orach Chaim 417–423",
    preparations: [
      "Recite Hallel at Shacharit. Yalkut Yosef rules Sephardim recite the abbreviated Hallel on Rosh Chodesh without a blessing — following Maran HaShulchan Aruch.",
      "Add Ya'aleh V'Yavo in every Amidah and in Birkat HaMazon. If forgotten at Shacharit or Mincha, the Amidah must be repeated; if forgotten at Ma'ariv, no repetition is required.",
      "Women customarily refrain from certain types of work (melacha) on Rosh Chodesh — this is their reward for refusing to donate gold for the Golden Calf, as cited in Yalkut Yosef.",
      "Observe Kiddush Levanah (sanctification of the new moon) on a clear night after 3 days from the new moon, ideally on Motzaei Shabbat.",
    ],
  },
  "Lag BaOmer": {
    source: "Yalkut Yosef, Orach Chaim 493",
    preparations: [
      "Prepare bonfires (medurot) for Lag BaOmer night to honour Rabbi Shimon bar Yochai, author of the Zohar. This is a major Sephardic tradition rooted in the customs of the Ari HaKadosh in Meron.",
      "Schedule haircuts for Lag BaOmer morning. Yalkut Yosef rules Sephardim may cut hair from the 33rd day of the Omer. Children's first haircuts (chalakah) are traditionally given on this day.",
      "Plan to visit the graves of tzaddikim — especially Rabbi Shimon bar Yochai in Meron — as this is one of the most auspicious visits of the year.",
      "Music, dancing, and joyous celebration are fully permitted on Lag BaOmer, unlike during the rest of the Omer period.",
    ],
  },
  "Tu BiShvat": {
    source: "Yalkut Yosef, various",
    preparations: [
      "Prepare the seven species (shivat haminim) of Israel: wheat, barley, grapes, figs, pomegranates, olives, and dates. Eating these fruits on Tu BiShvat is considered a segulah for blessing.",
      "Conduct a Tu BiShvat seder (following the Ari HaKadosh's custom) with four cups of wine progressing from white to red, and fruits arranged in Kabbalistic order — Yalkut Yosef records this as a beautiful Sephardic practice.",
      "Recite the blessing of HaEtz on tree fruits with extra kavanah (devotion) on this day, which is the halachic New Year for Trees (for tithes).",
      "Contribute to planting trees in Israel — Tu BiShvat is the halachic date from which tree fruits are counted for ma'aser (tithe) purposes.",
    ],
  },
  "Yom HaAtzma'ut": {
    source: "Yalkut Yosef (Rav Ovadia Yosef zt'l), Shu't Yalkut Yosef",
    preparations: [
      "Rav Ovadia Yosef zt'l ruled Hallel should be recited on Yom HaAtzma'ut without a blessing, as the establishment of the State of Israel — the beginning of the divine redemption — is a miraculous event deserving public praise.",
      "Attend a festive prayer service with Hallel, the special prayer for the State of Israel (Tefilah L'Shalom HaMedina), and songs of gratitude for the ingathering of exiles — a prophecy being fulfilled in our generation.",
      "Do not fast or deliver eulogies — Yalkut Yosef rules this day carries a joyous character. Celebrate with family meals and songs of thanksgiving.",
    ],
  },
  "Yom HaShoah": {
    source: "Yalkut Yosef, responsa on contemporary practice",
    preparations: [
      "Light a ner neshamah (memorial candle) to honour the six million Jewish souls who perished in the Holocaust. Rav Ovadia Yosef zt'l endorsed marking this day of remembrance with prayer and reflection.",
      "Recite Kaddish and El Malei Rachamim for the martyrs of the Shoah at the morning prayer service.",
      "Dedicate time to studying Jewish history of this period and honouring those who maintained their faith (Kiddush Hashem) under unimaginable suffering — keeping their memory alive is a sacred obligation.",
    ],
  },
};

function findHoliday(name: string): HolidayHalacha | null {
  const lower = name.toLowerCase().trim();
  for (const [key, value] of Object.entries(HOLIDAY_HALACHA)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return value;
    }
  }
  return null;
}

router.get("/holiday-halacha", (req, res) => {
  const name = (req.query["name"] as string) ?? "";
  if (!name.trim()) {
    res.status(400).json({ error: "name query param is required" });
    return;
  }
  const halacha = findHoliday(name);
  if (!halacha) {
    res.status(404).json({ error: "No halacha found for this holiday" });
    return;
  }
  res.json(halacha);
});

export default router;
