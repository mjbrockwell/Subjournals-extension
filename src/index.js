// Professional Subjournals Extension using roamjs-components
import runExtension from "roamjs-components/util/runExtension";
import createHTMLObserver from "roamjs-components/dom/createHTMLObserver";
import addStyle from "roamjs-components/dom/addStyle";
import getPageTitleByPageUid from "roamjs-components/queries/getPageTitleByPageUid";
import getPageUidByPageTitle from "roamjs-components/queries/getPageUidByPageTitle";
import getBasicTreeByParentUid from "roamjs-components/queries/getBasicTreeByParentUid";
import createBlock from "roamjs-components/writes/createBlock";
import createPage from "roamjs-components/writes/createPage";
import getSettingValueFromTree from "roamjs-components/util/getSettingValueFromTree";
import getCurrentPageUid from "roamjs-components/dom/getCurrentPageUid";

// Date page regex for [[MMMM nth, YYYY]] format
const DATE_PAGE_REGEX =
  /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(st|nd|rd|th), \d{4}$/;

// Color mapping for tags
const COLOR_MAP = {
  red: "#clr-lgt-red-act",
  orange: "#clr-lgt-orn-act",
  yellow: "#clr-lgt-ylo-act",
  green: "#clr-lgt-grn-act",
  blue: "#clr-lgt-blu-act",
  purple: "#clr-lgt-ppl-act",
  brown: "#clr-lgt-brn-act",
  grey: "#clr-lgt-gry-act",
  white: "#clr-wht-act",
  black: "#clr-blk-act",
};

// Month order for positioning (newest first)
const MONTH_ORDER = [
  "December",
  "November",
  "October",
  "September",
  "August",
  "July",
  "June",
  "May",
  "April",
  "March",
  "February",
  "January",
];

const isDatePage = (title) => {
  return DATE_PAGE_REGEX.test(title);
};

const getColorTag = (color) => {
  const normalizedColor = color?.toLowerCase().trim();
  return COLOR_MAP[normalizedColor] || "#clr-lgt-blu-act";
};

const parseDate = (dateTitle) => {
  const match = dateTitle.match(/^(\w+) (\d{1,2})\w{2}, (\d{4})$/);
  if (!match) return null;

  const [, month, day, year] = match;
  const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
  const dayName = new Date(year, monthIndex, day).toLocaleDateString("en-US", {
    weekday: "long",
  });

  return {
    year,
    month,
    day,
    dayName,
    monthYear: `${month} ${year}`,
    fullDate: dateTitle,
  };
};

const getCurrentPageTitle = () => {
  const pageUid = getCurrentPageUid();
  return pageUid ? getPageTitleByPageUid(pageUid) : null;
};

const getSubjournals = () => {
  const configPageUid = getPageUidByPageTitle("roam/subjournals");
  if (!configPageUid) return [];

  const tree = getBasicTreeByParentUid(configPageUid);
  const subjournalsBlock = tree.find((block) =>
    block.text.includes("**My Subjournals:**")
  );

  if (!subjournalsBlock) return [];

  return (
    subjournalsBlock.children?.map((child) => {
      const name = child.text.trim();
      const color = getSettingValueFromTree({
        tree: child.children || [],
        key: "Color",
        defaultValue: "blue",
      });

      return { name, color };
    }) || []
  );
};

const findJournalEntriesBlock = async (subjournalPageUid) => {
  const pageTree = getBasicTreeByParentUid(subjournalPageUid);
  let journalEntriesBlock = pageTree.find((block) =>
    block.text.includes("**Journal Entries:**")
  );

  if (!journalEntriesBlock) {
    // Create Journal Entries block
    const journalUid = await createBlock({
      parentUid: subjournalPageUid,
      order: 0,
      node: { text: "**Journal Entries:**" },
    });
    return journalUid;
  }

  return journalEntriesBlock.uid;
};

const findOrCreateYear = async (journalUid, year) => {
  const journalTree = getBasicTreeByParentUid(journalUid);
  let yearBlock = journalTree.find((block) =>
    block.text.includes(`[[${year}]]`)
  );

  if (!yearBlock) {
    const yearUid = await createBlock({
      parentUid: journalUid,
      order: 0,
      node: { text: `[[${year}]]` },
    });
    return yearUid;
  }

  return yearBlock.uid;
};

const findOrCreateMonth = async (yearUid, monthYear, month) => {
  const yearTree = getBasicTreeByParentUid(yearUid);
  let monthBlock = yearTree.find((block) =>
    block.text.includes(`[[${monthYear}]]`)
  );

  if (!monthBlock) {
    const monthIndex = MONTH_ORDER.indexOf(month);
    let insertOrder = 0;

    for (let i = 0; i < yearTree.length; i++) {
      const existingMonth = yearTree[i].text.match(/\[\[(\w+) \d{4}\]\]/)?.[1];
      if (existingMonth) {
        const existingIndex = MONTH_ORDER.indexOf(existingMonth);
        if (monthIndex < existingIndex) {
          insertOrder = i;
          break;
        }
        insertOrder = i + 1;
      }
    }

    const monthUid = await createBlock({
      parentUid: yearUid,
      order: insertOrder,
      node: { text: `[[${monthYear}]]` },
    });
    return monthUid;
  }

  return monthBlock.uid;
};

const findOrCreateDateEntry = async (monthUid, dateInfo, colorTag) => {
  const monthTree = getBasicTreeByParentUid(monthUid);
  const dateBanner = `#st0 ${dateInfo.dayName} [[${dateInfo.fullDate}]] ${colorTag}`;

  let existingDateBlock = monthTree.find((block) =>
    block.text.includes(`[[${dateInfo.fullDate}]]`)
  );

  if (existingDateBlock) {
    const existingChildren = getBasicTreeByParentUid(existingDateBlock.uid);
    const childCount = existingChildren.length;

    const newChildUid = await createBlock({
      parentUid: existingDateBlock.uid,
      order: childCount,
      node: { text: "" },
    });
    return newChildUid;
  } else {
    const dateBlockUid = await createBlock({
      parentUid: monthUid,
      order: 0,
      node: {
        text: dateBanner,
        children: [{ text: "" }],
      },
    });

    const dateBlockChildren = getBasicTreeByParentUid(dateBlockUid);
    return dateBlockChildren[0]?.uid;
  }
};

const createSubjournalStructure = async (
  subjournalPageUid,
  dateInfo,
  colorTag
) => {
  const journalUid = await findJournalEntriesBlock(subjournalPageUid);
  const yearUid = await findOrCreateYear(journalUid, dateInfo.year);
  const monthUid = await findOrCreateMonth(
    yearUid,
    dateInfo.monthYear,
    dateInfo.month
  );
  const cursorBlockUid = await findOrCreateDateEntry(
    monthUid,
    dateInfo,
    colorTag
  );

  return cursorBlockUid;
};

const createSubjournalButton = () => {
  const existingButton = document.getElementById("subjournals-button");
  if (existingButton) {
    existingButton.remove();
  }

  const button = document.createElement("button");
  button.id = "subjournals-button";
  button.textContent = "Add to Subjournal? Click here";
  button.className = "subjournals-trigger-button";

  const pageContent =
    document.querySelector(".roam-article") ||
    document.querySelector(".rm-article-wrapper") ||
    document.querySelector("#main-content");

  if (pageContent) {
    pageContent.style.position = "relative";
    pageContent.appendChild(button);
  }

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    showSubjournalDropdown(button);
  });

  return button;
};

const showSubjournalDropdown = (button) => {
  const existingDropdown = document.getElementById("subjournals-dropdown");
  if (existingDropdown) {
    existingDropdown.remove();
    return;
  }

  const subjournals = getSubjournals();
  if (subjournals.length === 0) {
    alert(
      'No subjournals configured. Please create [[roam/subjournals]] page with "**My Subjournals:**" block.'
    );
    return;
  }

  const dropdown = document.createElement("div");
  dropdown.id = "subjournals-dropdown";
  dropdown.className = "subjournals-dropdown";

  subjournals.forEach((subjournal) => {
    const option = document.createElement("div");
    option.className = "subjournals-option";
    option.textContent = subjournal.name;
    option.addEventListener("click", () => {
      handleSubjournalSelection(subjournal);
      dropdown.remove();
    });
    dropdown.appendChild(option);
  });

  const rect = button.getBoundingClientRect();
  dropdown.style.position = "absolute";
  dropdown.style.top = rect.bottom + 5 + "px";
  dropdown.style.right = "0px";

  button.parentElement.appendChild(dropdown);

  const closeDropdown = (e) => {
    if (!dropdown.contains(e.target) && e.target !== button) {
      dropdown.remove();
      document.removeEventListener("click", closeDropdown);
    }
  };

  setTimeout(() => {
    document.addEventListener("click", closeDropdown);
  }, 100);
};

const handleSubjournalSelection = async (subjournal) => {
  try {
    const currentPageTitle = getCurrentPageTitle();
    const dateInfo = parseDate(currentPageTitle);

    if (!dateInfo) {
      console.error(
        "Could not parse date from current page:",
        currentPageTitle
      );
      return;
    }

    const colorTag = getColorTag(subjournal.color);

    let subjournalPageUid = getPageUidByPageTitle(subjournal.name);
    if (!subjournalPageUid) {
      await createPage({
        title: subjournal.name,
      });
      subjournalPageUid = getPageUidByPageTitle(subjournal.name);
    }

    window.roamAlphaAPI.ui.rightSidebar.addWindow({
      window: {
        type: "outline",
        "block-uid": subjournalPageUid,
      },
    });

    const cursorBlockUid = await createSubjournalStructure(
      subjournalPageUid,
      dateInfo,
      colorTag
    );

    if (cursorBlockUid) {
      setTimeout(() => {
        window.roamAlphaAPI.ui.setBlockFocusAndSelection({
          location: {
            "block-uid": cursorBlockUid,
          },
        });
      }, 750);
    }
  } catch (error) {
    console.error("Error in subjournal selection:", error);
    alert("Error creating subjournal entry. Check console for details.");
  }
};

const checkCurrentPage = () => {
  const currentPageTitle = getCurrentPageTitle();

  if (currentPageTitle && isDatePage(currentPageTitle)) {
    if (!document.getElementById("subjournals-button")) {
      createSubjournalButton();
    }
  } else {
    const existingButton = document.getElementById("subjournals-button");
    if (existingButton) {
      existingButton.remove();
    }

    const existingDropdown = document.getElementById("subjournals-dropdown");
    if (existingDropdown) {
      existingDropdown.remove();
    }
  }
};

// 🚀 PROFESSIONAL EXTENSION EXPORT
export default runExtension(async ({ extensionAPI }) => {
  // Professional CSS injection with automatic cleanup
  const styleElement = addStyle(
    `
    .subjournals-trigger-button {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: background-color 0.2s ease;
    }
    
    .subjournals-trigger-button:hover {
      background: #fde68a;
      transform: translateY(-1px);
      box-shadow: 0 3px 6px rgba(0,0,0,0.15);
    }
    
    .subjournals-dropdown {
      position: absolute;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      z-index: 1001;
      min-width: 220px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .subjournals-option {
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f3f4f6;
      transition: background-color 0.2s ease;
      font-size: 14px;
    }
    
    .subjournals-option:hover {
      background: #f9fafb;
    }
    
    .subjournals-option:last-child {
      border-bottom: none;
      border-radius: 0 0 8px 8px;
    }
    
    .subjournals-option:first-child {
      border-radius: 8px 8px 0 0;
    }
  `,
    "subjournals-styles"
  );

  // Professional page change observer with automatic cleanup
  const pageObserver = createHTMLObserver({
    tag: "H1",
    className: "rm-title-display",
    callback: () => {
      setTimeout(checkCurrentPage, 200);
    },
  });

  // Initial check
  setTimeout(checkCurrentPage, 500);

  // 🔥 AUTOMATIC CLEANUP - All resources cleaned up automatically by runExtension
  return {
    observers: [pageObserver],
    elements: [styleElement],
  };
});
