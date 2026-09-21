import type { Level } from "../engine/types.js";

/**
 * First 50 puzzles from Microban (April 2000) by David W. Skinner.
 * Skinner released the set for use in Sokoban programs.
 */
export const LEVELS: Level[] = [
  {
    id: 1,
    name: "The Little Yard",
    difficulty: "easy",
    parMoves: 33,
    parPushes: 8,
    map: `####
# .#
#  ###
#*@  #
#  $ #
#  ###
####`,
  },
  {
    id: 2,
    name: "Nested Goals",
    difficulty: "easy",
    parMoves: 16,
    parPushes: 3,
    map: `######
#    #
# #@ #
# $* #
# .* #
#    #
######`,
  },
  {
    id: 3,
    name: "Side Pocket",
    difficulty: "medium",
    parMoves: 41,
    parPushes: 13,
    map: `  ####
###  ####
#     $ #
# #  #$ #
# . .#@ #
#########`,
  },
  {
    id: 4,
    name: "The Squeeze",
    difficulty: "easy",
    parMoves: 31,
    parPushes: 7,
    map: `########
#      #
# .**$@#
#      #
#####  #
    ####`,
  },
  {
    id: 5,
    name: "Diamond",
    difficulty: "easy",
    parMoves: 29,
    parPushes: 6,
    map: ` #######
 #     #
 # .$. #
## $@$ #
#  .$. #
#      #
########`,
  },
  {
    id: 6,
    name: "Two Chambers",
    difficulty: "expert",
    parMoves: 143,
    parPushes: 29,
    map: `###### #####
#    ###   #
# $$     #@#
# $ #...   #
#   ########
#####`,
  },
  {
    id: 7,
    name: "Checkerboard",
    difficulty: "easy",
    parMoves: 40,
    parPushes: 6,
    map: `#######
#     #
# .$. #
# $.$ #
# .$. #
# $.$ #
#  @  #
#######`,
  },
  {
    id: 8,
    name: "The Long Way",
    difficulty: "expert",
    parMoves: 97,
    parPushes: 32,
    map: `  ######
  # ..@#
  # $$ #
  ## ###
   # #
   # #
#### #
#    ##
# #   #
#   # #
###   #
  #####`,
  },
  {
    id: 9,
    name: "Tight Corner",
    difficulty: "medium",
    parMoves: 30,
    parPushes: 10,
    map: `#####
#.  ##
#@$$ #
##   #
 ##  #
  ##.#
   ###`,
  },
  {
    id: 10,
    name: "The Gauntlet",
    difficulty: "hard",
    parMoves: 109,
    parPushes: 21,
    map: `      #####
      #.  #
      #.# #
#######.# #
# @ $ $ $ #
# # # # ###
#       #
#########`,
  },
  {
    id: 11,
    name: "Backstop",
    difficulty: "medium",
    parMoves: 84,
    parPushes: 16,
    map: `  ######
  #    #
  # ##@##
### # $ #
# ..# $ #
#       #
#  ######
####`,
  },
  {
    id: 12,
    name: "The Elbow",
    difficulty: "medium",
    parMoves: 49,
    parPushes: 11,
    map: `#####
#   ##
# $  #
## $ ####
 ###@.  #
  #  .# #
  #     #
  #######`,
  },
  {
    id: 13,
    name: "Cascade",
    difficulty: "hard",
    parMoves: 59,
    parPushes: 21,
    map: `####
#. ##
#.@ #
#. $#
##$ ###
 # $  #
 #    #
 #  ###
 ####`,
  },
  {
    id: 14,
    name: "Pocket",
    difficulty: "medium",
    parMoves: 51,
    parPushes: 10,
    map: `#######
#     #
# # # #
#. $*@#
#   ###
#####`,
  },
  {
    id: 15,
    name: "The Notch",
    difficulty: "medium",
    parMoves: 43,
    parPushes: 12,
    map: `     ###
######@##
#    .* #
#   #   #
#####$# #
    #   #
    #####`,
  },
  {
    id: 16,
    name: "Split Path",
    difficulty: "expert",
    parMoves: 130,
    parPushes: 39,
    map: ` ####
 #  ####
 #     ##
## ##   #
#. .# @$##
#   # $$ #
#  .#    #
##########`,
  },
  {
    id: 17,
    name: "Triple Stack",
    difficulty: "medium",
    parMoves: 30,
    parPushes: 9,
    map: `#####
# @ #
#...#
#$$$##
#    #
#    #
######`,
  },
  {
    id: 18,
    name: "The Alcove",
    difficulty: "medium",
    parMoves: 73,
    parPushes: 13,
    map: `#######
#     #
#. .  #
# ## ##
#  $ #
###$ #
  #@ #
  #  #
  ####`,
  },
  {
    id: 19,
    name: "Lined Up",
    difficulty: "hard",
    parMoves: 48,
    parPushes: 20,
    map: `########
#   .. #
#  @$$ #
##### ##
   #  #
   #  #
   #  #
   ####`,
  },
  {
    id: 20,
    name: "Turnstile",
    difficulty: "medium",
    parMoves: 66,
    parPushes: 16,
    map: `#######
#     ###
#  @$$..#
#### ## #
  #     #
  #  ####
  #  #
  ####`,
  },
  {
    id: 21,
    name: "Twin Dots",
    difficulty: "easy",
    parMoves: 19,
    parPushes: 5,
    map: `####
#  ####
# . . #
# $$#@#
##    #
 ######`,
  },
  {
    id: 22,
    name: "The Well",
    difficulty: "medium",
    parMoves: 55,
    parPushes: 15,
    map: `#####
#   ###
#. .  #
#   # #
## #  #
 #@$$ #
 #    #
 #  ###
 ####`,
  },
  {
    id: 23,
    name: "Swap",
    difficulty: "medium",
    parMoves: 58,
    parPushes: 10,
    map: `#######
#  *  #
#     #
## # ##
 #$@.#
 #   #
 #####`,
  },
  {
    id: 24,
    name: "The Drop",
    difficulty: "medium",
    parMoves: 35,
    parPushes: 9,
    map: `# #####
  #   #
###$$@#
#   ###
#     #
# . . #
#######`,
  },
  {
    id: 25,
    name: "Cluster",
    difficulty: "easy",
    parMoves: 29,
    parPushes: 7,
    map: ` ####
 #  ###
 # $$ #
##... #
#  @$ #
#   ###
#####`,
  },
  {
    id: 26,
    name: "Open Court",
    difficulty: "medium",
    parMoves: 45,
    parPushes: 10,
    map: ` #####
 # @ #
 #   #
###$ #
# ...#
# $$ #
###  #
  ####`,
  },
  {
    id: 27,
    name: "The Latch",
    difficulty: "medium",
    parMoves: 53,
    parPushes: 10,
    map: `######
#   .#
# ## ##
#  $$@#
# #   #
#.  ###
#####`,
  },
  {
    id: 28,
    name: "The Pit",
    difficulty: "medium",
    parMoves: 33,
    parPushes: 9,
    map: `#####
#   #
# @ #
# $$###
##. . #
 #    #
 ######`,
  },
  {
    id: 29,
    name: "Mazelet",
    difficulty: "hard",
    parMoves: 148,
    parPushes: 22,
    map: `     #####
     #   ##
     #    #
 ######   #
##     #. #
# $ $ @  ##
# ######.#
#        #
##########`,
  },
  {
    id: 30,
    name: "Compact",
    difficulty: "easy",
    parMoves: 21,
    parPushes: 5,
    map: `####
#  ###
# $$ #
#... #
# @$ #
#   ##
#####`,
  },
  {
    id: 31,
    name: "Pinwheel",
    difficulty: "easy",
    parMoves: 21,
    parPushes: 6,
    map: `  ####
 ##  #
##@$.##
# $$  #
# . . #
###   #
  #####`,
  },
  {
    id: 32,
    name: "Packed",
    difficulty: "medium",
    parMoves: 35,
    parPushes: 9,
    map: ` ####
##  ###
#     #
#.**$@#
#   ###
##  #
 ####`,
  },
  {
    id: 33,
    name: "Columns",
    difficulty: "medium",
    parMoves: 51,
    parPushes: 10,
    map: `#######
#. #  #
#  $  #
#. $#@#
#  $  #
#. #  #
#######`,
  },
  {
    id: 34,
    name: "The Line",
    difficulty: "easy",
    parMoves: 41,
    parPushes: 8,
    map: `  ####
###  ####
#       #
#@$***. #
#       #
#########`,
  },
  {
    id: 35,
    name: "The Spine",
    difficulty: "expert",
    parMoves: 157,
    parPushes: 31,
    map: `  ####
 ##  #
 #. $#
 #.$ #
 #.$ #
 #.$ #
 #. $##
 #   @#
 ##   #
  #####`,
  },
  {
    id: 36,
    name: "The Parade",
    difficulty: "expert",
    parMoves: 216,
    parPushes: 59,
    map: `####
#  ############
# $ $ $ $ $ @ #
# .....       #
###############`,
  },
  {
    id: 37,
    name: "Staircase",
    difficulty: "hard",
    parMoves: 121,
    parPushes: 23,
    map: `      ###
##### #.#
#   ###.#
#   $ #.#
# $  $  #
#####@# #
    #   #
    #####`,
  },
  {
    id: 38,
    name: "Chambers",
    difficulty: "easy",
    parMoves: 39,
    parPushes: 8,
    map: `##########
#        #
# ##.### #
# # $$ . #
# . @$## #
#####    #
    ######`,
  },
  {
    id: 39,
    name: "Switchback",
    difficulty: "hard",
    parMoves: 91,
    parPushes: 27,
    map: `#####
#   ####
# # # .#
#    $ ###
### #$.  #
#   #@   #
# # ######
#   #
#####`,
  },
  {
    id: 40,
    name: "Plus Sign",
    difficulty: "easy",
    parMoves: 22,
    parPushes: 7,
    map: ` #####
 #   #
##   ##
# $$$ #
# .+. #
#######`,
  },
  {
    id: 41,
    name: "Triple Threat",
    difficulty: "medium",
    parMoves: 66,
    parPushes: 13,
    map: `#######
#     #
#@$$$ ##
#  #...#
##    ##
 ######`,
  },
  {
    id: 42,
    name: "The Shelf",
    difficulty: "medium",
    parMoves: 61,
    parPushes: 15,
    map: `   ####
   #  #
   #@ #
####$.#
#   $.#
# # $.#
#    ##
######`,
  },
  {
    id: 43,
    name: "Upper Deck",
    difficulty: "hard",
    parMoves: 64,
    parPushes: 22,
    map: `     ####
     # @#
     #  #
###### .#
#   $  .#
#  $$# .#
#    ####
###  #
  ####`,
  },
  {
    id: 44,
    name: "Duh!",
    difficulty: "easy",
    parMoves: 1,
    parPushes: 1,
    map: `#####
#@$.#
#####`,
  },
  {
    id: 45,
    name: "Stacked",
    difficulty: "medium",
    parMoves: 47,
    parPushes: 11,
    map: `######
#... #
#  $ #
# #$##
#  $ #
#  @ #
######`,
  },
  {
    id: 46,
    name: "The Knot",
    difficulty: "easy",
    parMoves: 47,
    parPushes: 8,
    map: ` ######
##    #
#  ## #
# # $ #
#  * .#
## #@##
 #   #
 #####`,
  },
  {
    id: 47,
    name: "Crossfire",
    difficulty: "hard",
    parMoves: 89,
    parPushes: 22,
    map: `  #######
###     #
# $ $   #
# ### #####
# @ . .   #
#   ###   #
##### #####`,
  },
  {
    id: 48,
    name: "Narrow Hall",
    difficulty: "medium",
    parMoves: 71,
    parPushes: 14,
    map: `######
#  @ #
#  # ##
# .#  ##
# .$$$ #
# .#   #
####   #
   #####`,
  },
  {
    id: 49,
    name: "The Shaft",
    difficulty: "hard",
    parMoves: 86,
    parPushes: 21,
    map: `######
# @  #
# $# #
# $  #
# $ ##
### ####
 #  #  #
 #...  #
 #     #
 #######`,
  },
  {
    id: 50,
    name: "The Landing",
    difficulty: "hard",
    parMoves: 96,
    parPushes: 17,
    map: `  ####
###  #####
#  $  @..#
# $    # #
### #### #
  #      #
  ########`,
  },
];

export function levelById(id: number): Level {
  const level = LEVELS.find((item) => item.id === id);
  if (!level) throw new Error(`Unknown level ${id}.`);
  return level;
}

export const LEVEL_COUNT = LEVELS.length;
