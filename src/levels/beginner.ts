import type { LevelDefinition } from "@/engine/sokoban/types";

export const LEVELS: LevelDefinition[] = [
  {
    id: "tutorial",
    number: 1,
    name: "The First Push",
    title: "LEVEL 01",
    difficulty: "tutorial",
    description: "One box, one goal. Watch a single push become a search node.",
    ascii: `#####
#@$.#
#####`,
  },
  {
    id: "basic",
    number: 2,
    name: "Two Bodies",
    title: "LEVEL 02",
    difficulty: "basic",
    description: "Two boxes. The solver must assign each box to a goal — not grab the nearest twice.",
    ascii: `######
# .  #
# $$ #
#@ . #
######`,
  },
  {
    id: "intermediate",
    number: 3,
    name: "The Corridor",
    title: "LEVEL 03",
    difficulty: "intermediate",
    description: "Order matters. Push the wrong box first and the hallway closes.",
    ascii: `#######
#     #
#@ $$ #
#  #  #
#  .. #
#######`,
  },
  {
    id: "trap",
    number: 4,
    name: "The Trap",
    title: "LEVEL 04",
    difficulty: "hard",
    description: "This level shows why greedy movement can fail. The closest-looking push can freeze a box.",
    ascii: `########
#      #
# $ $  #
#  ##  #
#  ..  #
#  @   #
########`,
  },
  {
    id: "expert",
    number: 5,
    name: "Cold Storage",
    title: "LEVEL 05",
    difficulty: "expert",
    description: "A larger search space with corners that punish careless pushes.",
    ascii: `#########
#       #
#  $ $  #
#   @   #
#  $ $  #
#  .... #
#########`,
  },
];

export function levelById(id: string): LevelDefinition | undefined {
  return LEVELS.find((level) => level.id === id);
}

export { LEVELS as beginnerLevels };
